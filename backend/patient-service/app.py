import base64
from datetime import datetime
import json
import logging
import math
import os
import uuid

import boto3
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///patient_service.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Configure AWS S3
S3_BUCKET = os.environ.get('S3_BUCKET', 'hms-patient-images')
S3_REGION = os.environ.get('S3_REGION', 'us-east-1')
S3_ACCESS_KEY = os.environ.get('S3_ACCESS_KEY', '')
S3_SECRET_KEY = os.environ.get('S3_SECRET_KEY', '')

# Initialize S3 client
s3_client = boto3.client(
    's3',
    region_name=S3_REGION,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY
) if S3_ACCESS_KEY and S3_SECRET_KEY else None

# User roles for RBAC
ROLES = {
    'ADMIN': {
        'description': 'Administrator with full access',
        'permissions': ['read', 'write', 'delete', 'admin']
    },
    'DOCTOR': {
        'description': 'Medical doctor with access to all patient records',
        'permissions': ['read', 'write']
    },
    'NURSE': {
        'description': 'Nurse with limited access to patient records',
        'permissions': ['read', 'limited_write']
    },
    'RECEPTIONIST': {
        'description': 'Front desk staff with basic access',
        'permissions': ['read', 'limited_write']
    },
    'PATIENT': {
        'description': 'Patient with access only to their own records',
        'permissions': ['read_own']
    }
}

# Define User model for RBAC
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)  # In a real app, this would be hashed
    firstName = db.Column(db.String(50), nullable=False)
    lastName = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    role = db.Column(db.String(20), nullable=False)  # One of the ROLES keys
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'firstName': self.firstName,
            'lastName': self.lastName,
            'email': self.email,
            'role': self.role,
            'permissions': ROLES.get(self.role, {}).get('permissions', [])
        }
    
    def has_permission(self, permission):
        user_permissions = ROLES.get(self.role, {}).get('permissions', [])
        return permission in user_permissions

# Helper classes for SQLite JSON storage
class MedicalConditionList(db.TypeDecorator):
    impl = db.Text
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return '[]'
        return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return []
        return json.loads(value)

class AllergiesList(db.TypeDecorator):
    impl = db.Text
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return '[]'
        return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        if value is None:
            return []
        return json.loads(value)

# Define Patient model
class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    firstName = db.Column(db.String(50), nullable=False)
    lastName = db.Column(db.String(50), nullable=False)
    dateOfBirth = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    gender = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    insuranceId = db.Column(db.String(50), nullable=True)
    medicalConditions = db.Column(MedicalConditionList, default=list)
    allergies = db.Column(AllergiesList, default=list)
    notes = db.Column(db.Text, nullable=True)
    profileImageUrl = db.Column(db.String(500), nullable=True)  # S3 URL for profile image
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    createdBy = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'firstName': self.firstName,
            'lastName': self.lastName,
            'dateOfBirth': self.dateOfBirth,
            'gender': self.gender,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'insuranceId': self.insuranceId,
            'medicalConditions': self.medicalConditions,
            'allergies': self.allergies,
            'notes': self.notes,
            'profileImageUrl': self.profileImageUrl,
            'createdBy': self.createdBy
        }

# Define Medical Image model for storing multiple images per patient
class MedicalImage(db.Model):
    __tablename__ = 'medical_images'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patientId = db.Column(db.String(36), db.ForeignKey('patients.id'), nullable=False)
    imageUrl = db.Column(db.String(500), nullable=False)  # S3 URL
    imageType = db.Column(db.String(50), nullable=False)  # X-ray, MRI, etc.
    description = db.Column(db.Text, nullable=True)
    uploadedAt = db.Column(db.DateTime, default=datetime.utcnow)
    uploadedBy = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patientId,
            'imageUrl': self.imageUrl,
            'imageType': self.imageType,
            'description': self.description,
            'uploadedAt': self.uploadedAt.isoformat(),
            'uploadedBy': self.uploadedBy
        }

# Define Appointment model
class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patientId = db.Column(db.String(36), db.ForeignKey('patients.id'), nullable=False)
    doctorId = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    appointmentDate = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    startTime = db.Column(db.String(8), nullable=False)  # Format: HH:MM:SS
    endTime = db.Column(db.String(8), nullable=False)  # Format: HH:MM:SS
    status = db.Column(db.String(20), nullable=False)  # Scheduled, Completed, Canceled, No-Show
    reason = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patientId,
            'doctorId': self.doctorId,
            'appointmentDate': self.appointmentDate,
            'startTime': self.startTime,
            'endTime': self.endTime,
            'status': self.status,
            'reason': self.reason,
            'notes': self.notes,
            'createdAt': self.createdAt.isoformat(),
            'updatedAt': self.updatedAt.isoformat()
        }

# Define Medication model
class Medication(db.Model):
    __tablename__ = 'medications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patientId = db.Column(db.String(36), db.ForeignKey('patients.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    dosage = db.Column(db.String(50), nullable=False)
    frequency = db.Column(db.String(100), nullable=False)
    startDate = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    endDate = db.Column(db.String(10), nullable=True)  # Format: YYYY-MM-DD
    prescribedBy = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patientId,
            'name': self.name,
            'dosage': self.dosage,
            'frequency': self.frequency,
            'startDate': self.startDate,
            'endDate': self.endDate,
            'prescribedBy': self.prescribedBy,
            'notes': self.notes,
            'createdAt': self.createdAt.isoformat(),
            'updatedAt': self.updatedAt.isoformat()
        }

# Define Medical Record model
class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    patientId = db.Column(db.String(36), db.ForeignKey('patients.id'), nullable=False)
    doctorId = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    visitDate = db.Column(db.String(10), nullable=False)  # Format: YYYY-MM-DD
    chiefComplaint = db.Column(db.String(200), nullable=False)
    diagnosis = db.Column(db.Text, nullable=False)
    treatmentPlan = db.Column(db.Text, nullable=False)
    followUpNeeded = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patientId': self.patientId,
            'doctorId': self.doctorId,
            'visitDate': self.visitDate,
            'chiefComplaint': self.chiefComplaint,
            'diagnosis': self.diagnosis,
            'treatmentPlan': self.treatmentPlan,
            'followUpNeeded': self.followUpNeeded,
            'notes': self.notes,
            'createdAt': self.createdAt.isoformat(),
            'updatedAt': self.updatedAt.isoformat()
        }

# Helper function to check user authorization
def authorize(required_permission):
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Set development mode for testing
            os.environ['FLASK_ENV'] = 'development'
            
            # For simplicity in this prototype, we'll use a header to identify the user
            user_id = request.headers.get('X-User-ID')
            
            # For development mode, allow requests without authentication
            if os.environ.get('FLASK_ENV') == 'development':
                # If user_id is provided, use it; otherwise, create a mock admin user
                if user_id:
                    mock_user = User(
                        id=user_id,
                        username=f'user-{user_id}',
                        password='password',
                        firstName='Mock',
                        lastName='User',
                        email=f'user-{user_id}@example.com',
                        role='ADMIN'  # Give admin role for full permissions
                    )
                else:
                    mock_user = User(
                        id='dev-admin-id',
                        username='dev-admin',
                        password='password',
                        firstName='Dev',
                        lastName='Admin',
                        email='dev@example.com',
                        role='ADMIN'
                    )
                request.user = mock_user
                return func(*args, **kwargs)
            
            # Production mode logic (unchanged)
            if not user_id:
                return jsonify({'message': 'Unauthorized - User ID not provided'}), 401
            
            # Try to find the user
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({'message': 'Unauthorized - User not found'}), 401
            
            if not user.has_permission(required_permission):
                return jsonify({'message': f'Forbidden - Requires {required_permission} permission'}), 403
            
            # Add the authenticated user to the request context
            request.user = user
            return func(*args, **kwargs)
        
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

# Helper function to upload an image to S3
def upload_to_s3(file_data, folder='patient-profiles'):
    if not s3_client:
        return None
    
    try:
        # Generate a unique filename
        filename = f"{str(uuid.uuid4())}-{secure_filename(file_data.filename)}"
        
        # Upload to S3
        s3_client.upload_fileobj(
            file_data,
            S3_BUCKET,
            f"{folder}/{filename}",
            ExtraArgs={'ACL': 'public-read'}
        )
        
        # Return the S3 URL
        return f"https://{S3_BUCKET}.s3.amazonaws.com/{folder}/{filename}"
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        return None

# Upload base64 encoded image to S3
def upload_base64_to_s3(base64_data, folder='patient-profiles'):
    if not s3_client or not base64_data:
        return None
    
    try:
        # Extract the file data and extension
        file_data = base64.b64decode(base64_data.split(',')[1] if ',' in base64_data else base64_data)
        file_ext = 'jpg'  # Default extension
        
        # Generate a unique filename
        filename = f"{str(uuid.uuid4())}.{file_ext}"
        
        # Upload to S3
        s3_client.put_object(
            Body=file_data,
            Bucket=S3_BUCKET,
            Key=f"{folder}/{filename}",
            ContentType=f"image/{file_ext}",
            ACL='public-read'
        )
        
        # Return the S3 URL
        return f"https://{S3_BUCKET}.s3.amazonaws.com/{folder}/{filename}"
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        return None

# Add GraphQL endpoint
@app.route('/graphql', methods=['GET', 'POST'])
def graphql_server():
    from flask_graphql import GraphQLView
    from schema import schema
    view = GraphQLView.as_view('graphql', schema=schema, graphiql=True)
    return view()

# API Endpoints
@app.route('/api/patients', methods=['GET'])
@authorize('read')
def get_all_patients():
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit maximum per_page to 100 to prevent excessive loads
    per_page = min(per_page, 100)
    
    # Get total count for pagination metadata
    total_patients = Patient.query.count()
    
    # Get paginated patients
    patients = Patient.query.order_by(Patient.lastName.asc(), Patient.firstName.asc())
    
    # Filter by user if not admin
    if request.user and request.user.role != 'ADMIN':
        patients = patients.filter_by(createdBy=request.user.id)
    
    # Apply pagination
    patients = patients.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    response = {
        'data': [patient.to_dict() for patient in patients.items],
        'pagination': {
            'total': total_patients,
            'per_page': per_page,
            'current_page': page,
            'total_pages': math.ceil(total_patients / per_page),
            'has_next': patients.has_next,
            'has_prev': patients.has_prev
        }
    }
    
    return jsonify(response)

@app.route('/api/patients/<string:id>', methods=['GET'])
@authorize('read')
def get_patient(id):
    patient = Patient.query.get(id)
    
    # For development mode, create a mock patient if it doesn't exist
    if not patient and os.environ.get('FLASK_ENV') == 'development':
        app.logger.info(f"Creating mock patient with ID: {id} for development")
        mock_patient = Patient(
            id=id,
            firstName="Mock",
            lastName="Patient",
            dateOfBirth="2000-01-01",
            gender="Other",
            email=f"patient-{id}@example.com",
            phone="123-456-7890",
            address="123 Mock Street",
            insuranceId="MOCK-INS-123",
            medicalConditions=["None"],
            allergies=["None"],
            notes="Mock patient for development",
            createdBy=request.user.id
        )
        
        # Add to database temporarily
        db.session.add(mock_patient)
        db.session.commit()
        
        return jsonify(mock_patient.to_dict())
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # For patients with role "PATIENT", they can only view their own records
    if request.user.role == 'PATIENT' and request.user.id != patient.createdBy:
        return jsonify({'message': 'Forbidden - You can only view your own records'}), 403
        
    return jsonify(patient.to_dict())

@app.route('/api/patients', methods=['POST'])
@authorize('write')
def create_patient():
    data = request.get_json()
    
    # Log the incoming data for debugging
    app.logger.info(f"Creating patient with data: {json.dumps(data)}")
    
    # Convert string arrays to lists if they are strings
    if 'medicalConditions' in data:
        if isinstance(data['medicalConditions'], str):
            data['medicalConditions'] = [condition.strip() for condition in data['medicalConditions'].split(',') if condition.strip()]
        elif not isinstance(data['medicalConditions'], list):
            data['medicalConditions'] = []
    else:
        data['medicalConditions'] = []
    
    if 'allergies' in data:
        if isinstance(data['allergies'], str):
            data['allergies'] = [allergy.strip() for allergy in data['allergies'].split(',') if allergy.strip()]
        elif not isinstance(data['allergies'], list):
            data['allergies'] = []
    else:
        data['allergies'] = []
    
    app.logger.info(f"Processed medical conditions: {data.get('medicalConditions')}")
    app.logger.info(f"Processed allergies: {data.get('allergies')}")
    
    # Process profile image if provided
    profile_image_url = None
    if 'profileImage' in data and data['profileImage']:
        profile_image_url = upload_base64_to_s3(data['profileImage'])
    
    new_patient = Patient(
        firstName=data.get('firstName'),
        lastName=data.get('lastName'),
        dateOfBirth=data.get('dateOfBirth'),
        gender=data.get('gender'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        insuranceId=data.get('insuranceId'),
        medicalConditions=data.get('medicalConditions', []),
        allergies=data.get('allergies', []),
        notes=data.get('notes', ''),
        profileImageUrl=profile_image_url,
        createdBy=request.user.id
    )
    
    db.session.add(new_patient)
    db.session.commit()
    
    return jsonify(new_patient.to_dict()), 201

@app.route('/api/patients/<string:id>', methods=['PUT'])
@authorize('write')
def update_patient(id):
    patient = Patient.query.get(id)
    
    # For development mode, create a mock patient if it doesn't exist
    if not patient and os.environ.get('FLASK_ENV') == 'development':
        app.logger.info(f"Creating mock patient with ID: {id} for development during update")
        patient = Patient(
            id=id,
            firstName="Mock",
            lastName="Patient",
            dateOfBirth="2000-01-01",
            gender="Other",
            email=f"patient-{id}@example.com",
            phone="123-456-7890",
            address="123 Mock Street",
            insuranceId="MOCK-INS-123",
            medicalConditions=["None"],
            allergies=["None"],
            notes="Mock patient for development",
            createdBy=request.user.id
        )
        
        # Add to database
        db.session.add(patient)
        db.session.commit()
    
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    data = request.get_json()
    
    # Update patient fields
    if 'firstName' in data:
        patient.firstName = data['firstName']
    if 'lastName' in data:
        patient.lastName = data['lastName']
    if 'dateOfBirth' in data:
        patient.dateOfBirth = data['dateOfBirth']
    if 'gender' in data:
        patient.gender = data['gender']
    if 'email' in data:
        patient.email = data['email']
    if 'phone' in data:
        patient.phone = data['phone']
    if 'address' in data:
        patient.address = data['address']
    if 'insuranceId' in data:
        patient.insuranceId = data['insuranceId']
    
    # Handle arrays
    if 'medicalConditions' in data:
        if isinstance(data['medicalConditions'], str):
            patient.medicalConditions = [condition.strip() for condition in data['medicalConditions'].split(',') if condition.strip()]
        else:
            patient.medicalConditions = data['medicalConditions']
    
    if 'allergies' in data:
        if isinstance(data['allergies'], str):
            patient.allergies = [allergy.strip() for allergy in data['allergies'].split(',') if allergy.strip()]
        else:
            patient.allergies = data['allergies']
    
    if 'notes' in data:
        patient.notes = data['notes']
    
    # Process profile image if provided
    if 'profileImage' in data and data['profileImage']:
        patient.profileImageUrl = upload_base64_to_s3(data['profileImage'])
    
    db.session.commit()
    
    return jsonify(patient.to_dict())

@app.route('/api/patients/<string:id>', methods=['DELETE'])
@authorize('delete')
def delete_patient(id):
    try:
        patient = Patient.query.get(id)
        if not patient:
            return jsonify({'message': 'Patient not found'}), 404
        
        app.logger.info(f"Deleting patient with ID: {id}")
        app.logger.info(f"Request user: {request.user.id if hasattr(request, 'user') else 'No user'}")
        app.logger.info(f"Request headers: {request.headers}")
        
        # Delete associated medical records first (if they exist)
        try:
            medical_records = MedicalRecord.query.filter_by(patientId=id).all()
            app.logger.info(f"Found {len(medical_records)} medical records to delete")
            for record in medical_records:
                db.session.delete(record)
        except Exception as record_error:
            app.logger.error(f"Error deleting medical records: {str(record_error)}")
            # Continue with patient deletion even if records can't be deleted
        
        # Delete the patient
        db.session.delete(patient)
        db.session.commit()
        
        app.logger.info(f"Successfully deleted patient with ID: {id}")
        return jsonify({'message': 'Patient deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting patient {id}: {str(e)}")
        return jsonify({'message': f'Error deleting patient: {str(e)}'}), 500

@app.route('/api/patients/<string:patient_id>/images', methods=['POST'])
@authorize('write')
def upload_medical_image(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    data = request.get_json()
    
    # Process the medical image
    if 'imageData' in data and data['imageData']:
        image_url = upload_base64_to_s3(data['imageData'], folder='medical-images')
        if not image_url:
            return jsonify({'message': 'Failed to upload image'}), 500
        
        medical_image = MedicalImage(
            patientId=patient_id,
            imageUrl=image_url,
            imageType=data.get('imageType', 'Other'),
            description=data.get('description', ''),
            uploadedBy=request.user.id
        )
        
        db.session.add(medical_image)
        db.session.commit()
        
        return jsonify(medical_image.to_dict()), 201
    
    return jsonify({'message': 'No image data provided'}), 400

@app.route('/api/patients/<string:patient_id>/images', methods=['GET'])
@authorize('read')
def get_patient_images(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # For patients with role "PATIENT", they can only view their own records
    if request.user.role == 'PATIENT' and request.user.id != patient.createdBy:
        return jsonify({'message': 'Forbidden - You can only view your own records'}), 403
    
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit maximum per_page to 100 to prevent excessive loads
    per_page = min(per_page, 100)
    
    # Get total count for pagination metadata
    total_images = MedicalImage.query.filter_by(patientId=patient_id).count()
    
    # Get paginated images, ordered by most recent first
    images = MedicalImage.query.filter_by(patientId=patient_id).order_by(MedicalImage.uploadedAt.desc())
    images = images.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    response = {
        'data': [image.to_dict() for image in images.items],
        'pagination': {
            'total': total_images,
            'per_page': per_page,
            'current_page': page,
            'total_pages': math.ceil(total_images / per_page) if total_images > 0 else 1,
            'has_next': images.has_next,
            'has_prev': images.has_prev
        }
    }
    
    return jsonify(response)

@app.route('/api/appointments', methods=['POST'])
@authorize('write')
def create_appointment():
    data = request.get_json()
    
    new_appointment = Appointment(
        patientId=data.get('patientId'),
        doctorId=data.get('doctorId'),
        appointmentDate=data.get('appointmentDate'),
        startTime=data.get('startTime'),
        endTime=data.get('endTime'),
        status=data.get('status'),
        reason=data.get('reason'),
        notes=data.get('notes', '')
    )
    
    db.session.add(new_appointment)
    db.session.commit()
    
    return jsonify(new_appointment.to_dict()), 201

@app.route('/api/appointments', methods=['GET'])
@authorize('read')
def get_all_appointments():
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit maximum per_page to 100 to prevent excessive loads
    per_page = min(per_page, 100)
    
    # Optional date filter
    date_filter = request.args.get('date')
    
    # Build query
    query = Appointment.query
    
    # Apply date filter if provided
    if date_filter:
        query = query.filter(Appointment.appointmentDate == date_filter)
    
    # Filter by doctor if user is not admin
    if request.user and request.user.role != 'ADMIN':
        query = query.filter(Appointment.doctorId == request.user.id)
    
    # Get total count for pagination metadata
    total_appointments = query.count()
    
    # Order by date and time
    query = query.order_by(Appointment.appointmentDate.asc(), Appointment.startTime.asc())
    
    # Apply pagination
    appointments = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    response = {
        'data': [appointment.to_dict() for appointment in appointments.items],
        'pagination': {
            'total': total_appointments,
            'per_page': per_page,
            'current_page': page,
            'total_pages': math.ceil(total_appointments / per_page) if total_appointments > 0 else 1,
            'has_next': appointments.has_next,
            'has_prev': appointments.has_prev
        }
    }
    
    return jsonify(response)

@app.route('/api/appointments/<string:id>', methods=['GET'])
@authorize('read')
def get_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    return jsonify(appointment.to_dict())

@app.route('/api/appointments/<string:id>', methods=['PUT'])
@authorize('write')
def update_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    data = request.get_json()
    
    # Update appointment attributes
    for key, value in data.items():
        if hasattr(appointment, key):
            setattr(appointment, key, value)
    
    db.session.commit()
    
    return jsonify(appointment.to_dict())

@app.route('/api/appointments/<string:id>', methods=['DELETE'])
@authorize('delete')
def delete_appointment(id):
    appointment = Appointment.query.get(id)
    if not appointment:
        return jsonify({'message': 'Appointment not found'}), 404
    
    db.session.delete(appointment)
    db.session.commit()
    
    return '', 204

@app.route('/api/medications', methods=['POST'])
@authorize('write')
def create_medication():
    data = request.get_json()
    
    new_medication = Medication(
        patientId=data.get('patientId'),
        name=data.get('name'),
        dosage=data.get('dosage'),
        frequency=data.get('frequency'),
        startDate=data.get('startDate'),
        endDate=data.get('endDate'),
        prescribedBy=data.get('prescribedBy'),
        notes=data.get('notes', '')
    )
    
    db.session.add(new_medication)
    db.session.commit()
    
    return jsonify(new_medication.to_dict()), 201

@app.route('/api/medications', methods=['GET'])
@authorize('read')
def get_all_medications():
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit maximum per_page to 100 to prevent excessive loads
    per_page = min(per_page, 100)
    
    # Optional patient filter
    patient_id = request.args.get('patient_id')
    
    # Build query
    query = Medication.query
    
    # Apply patient filter if provided
    if patient_id:
        query = query.filter(Medication.patientId == patient_id)
    
    # Filter by user role
    if request.user and request.user.role != 'ADMIN':
        # For doctors, only show medications they prescribed
        query = query.filter(Medication.prescribedBy == request.user.id)
    
    # Get total count for pagination metadata
    total_medications = query.count()
    
    # Order by start date descending (newest first)
    query = query.order_by(Medication.startDate.desc())
    
    # Apply pagination
    medications = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    response = {
        'data': [medication.to_dict() for medication in medications.items],
        'pagination': {
            'total': total_medications,
            'per_page': per_page,
            'current_page': page,
            'total_pages': math.ceil(total_medications / per_page) if total_medications > 0 else 1,
            'has_next': medications.has_next,
            'has_prev': medications.has_prev
        }
    }
    
    return jsonify(response)

@app.route('/api/medications/<string:id>', methods=['GET'])
@authorize('read')
def get_medication(id):
    medication = Medication.query.get(id)
    if not medication:
        return jsonify({'message': 'Medication not found'}), 404
    
    return jsonify(medication.to_dict())

@app.route('/api/medications/<string:id>', methods=['PUT'])
@authorize('write')
def update_medication(id):
    medication = Medication.query.get(id)
    if not medication:
        return jsonify({'message': 'Medication not found'}), 404
    
    data = request.get_json()
    
    # Update medication attributes
    for key, value in data.items():
        if hasattr(medication, key):
            setattr(medication, key, value)
    
    db.session.commit()
    
    return jsonify(medication.to_dict())

@app.route('/api/medications/<string:id>', methods=['DELETE'])
@authorize('delete')
def delete_medication(id):
    medication = Medication.query.get(id)
    if not medication:
        return jsonify({'message': 'Medication not found'}), 404
    
    db.session.delete(medication)
    db.session.commit()
    
    return '', 204

@app.route('/api/medical-records', methods=['POST'])
@authorize('write')
def create_medical_record():
    data = request.get_json()
    
    new_record = MedicalRecord(
        patientId=data.get('patientId'),
        doctorId=data.get('doctorId'),
        visitDate=data.get('visitDate'),
        chiefComplaint=data.get('chiefComplaint'),
        diagnosis=data.get('diagnosis'),
        treatmentPlan=data.get('treatmentPlan'),
        followUpNeeded=data.get('followUpNeeded', False),
        notes=data.get('notes', '')
    )
    
    db.session.add(new_record)
    db.session.commit()
    
    return jsonify(new_record.to_dict()), 201

@app.route('/api/medical-records', methods=['GET'])
@authorize('read')
def get_all_medical_records():
    # Get pagination parameters from query string
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Limit maximum per_page to 100 to prevent excessive loads
    per_page = min(per_page, 100)
    
    # Optional patient filter
    patient_id = request.args.get('patient_id')
    
    # Build query
    query = MedicalRecord.query
    
    # Apply patient filter if provided
    if patient_id:
        query = query.filter(MedicalRecord.patientId == patient_id)
    
    # Filter by user role
    if request.user and request.user.role != 'ADMIN':
        # For doctors, only show records they created
        query = query.filter(MedicalRecord.doctorId == request.user.id)
    
    # Get total count for pagination metadata
    total_records = query.count()
    
    # Order by visit date descending (newest first)
    query = query.order_by(MedicalRecord.visitDate.desc())
    
    # Apply pagination
    records = query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Prepare response
    response = {
        'data': [record.to_dict() for record in records.items],
        'pagination': {
            'total': total_records,
            'per_page': per_page,
            'current_page': page,
            'total_pages': math.ceil(total_records / per_page) if total_records > 0 else 1,
            'has_next': records.has_next,
            'has_prev': records.has_prev
        }
    }
    
    return jsonify(response)

@app.route('/api/medical-records/<string:id>', methods=['GET'])
@authorize('read')
def get_medical_record(id):
    medical_record = MedicalRecord.query.get(id)
    if not medical_record:
        return jsonify({'message': 'Medical record not found'}), 404
    
    return jsonify(medical_record.to_dict())

@app.route('/api/medical-records/<string:id>', methods=['PUT'])
@authorize('write')
def update_medical_record(id):
    medical_record = MedicalRecord.query.get(id)
    if not medical_record:
        return jsonify({'message': 'Medical record not found'}), 404
    
    data = request.get_json()
    
    # Update medical record attributes
    for key, value in data.items():
        if hasattr(medical_record, key):
            setattr(medical_record, key, value)
    
    db.session.commit()
    
    return jsonify(medical_record.to_dict())

@app.route('/api/medical-records/<string:id>', methods=['DELETE'])
@authorize('delete')
def delete_medical_record(id):
    medical_record = MedicalRecord.query.get(id)
    if not medical_record:
        return jsonify({'message': 'Medical record not found'}), 404
    
    db.session.delete(medical_record)
    db.session.commit()
    
    return '', 204

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400
    
    user = User.query.filter_by(username=username).first()
    if not user or user.password != password:  # In a real app, use password hashing
        return jsonify({'message': 'Invalid username or password'}), 401
    
    return jsonify({
        'user': user.to_dict(),
        'token': user.id  # In a real app, use JWT or other token mechanism
    })

# Adding a public endpoint for testing
@app.route('/api/public/test', methods=['GET'])
def public_test():
    return jsonify({'message': 'Public API is working!'}), 200

@app.route('/health', methods=['GET'])
def health_check():
    try:
        db.session.execute('SELECT 1')
        db_status = 'connected'
    except Exception:
        db_status = 'error'
    
    return jsonify({
        'status': 'UP',
        'service': 'patient-service',
        'database': db_status,
        's3': 'configured' if s3_client else 'not configured'
    }), 200

# For development - seed data
@app.route('/api/seed', methods=['GET'])
def seed_db():
    # Clear existing data
    MedicalImage.query.delete()
    Patient.query.delete()
    User.query.delete()
    Appointment.query.delete()
    Medication.query.delete()
    MedicalRecord.query.delete()
    
    # Create users for different roles
    admin = User(
        username='admin',
        password='admin123',  # In real app, should be hashed
        firstName='Admin',
        lastName='User',
        email='admin@hospital.com',
        role='ADMIN'
    )
    
    doctor1 = User(
        username='doctor1',
        password='doctor123',  # In real app, should be hashed
        firstName='John',
        lastName='Smith',
        email='john.smith@hospital.com',
        role='DOCTOR'
    )
    
    doctor2 = User(
        username='doctor2',
        password='doctor123',  # In real app, should be hashed
        firstName='Sarah',
        lastName='Johnson',
        email='sarah.johnson@hospital.com',
        role='DOCTOR'
    )
    
    nurse = User(
        username='nurse1',
        password='nurse123',  # In real app, should be hashed
        firstName='Emily',
        lastName='Davis',
        email='emily.davis@hospital.com',
        role='NURSE'
    )
    
    receptionist = User(
        username='reception1',
        password='reception123',  # In real app, should be hashed
        firstName='Mike',
        lastName='Wilson',
        email='mike.wilson@hospital.com',
        role='RECEPTIONIST'
    )
    
    patient_user = User(
        username='patient1',
        password='patient123',  # In real app, should be hashed
        firstName='Alice',
        lastName='Brown',
        email='alice.brown@example.com',
        role='PATIENT'
    )
    
    db.session.add_all([admin, doctor1, doctor2, nurse, receptionist, patient_user])
    db.session.commit()
    
    # Create patients
    patient1 = Patient(
        firstName='Alice',
        lastName='Brown',
        dateOfBirth='1985-05-15',
        gender='Female',
        email='alice.brown@example.com',
        phone='555-123-4567',
        address='123 Main St, Cityville, ST 12345',
        insuranceId='INS12345',
        medicalConditions=['Asthma', 'Hypertension'],
        allergies=['Penicillin', 'Peanuts'],
        notes='Patient has seasonal allergies and uses an inhaler as needed.',
        createdBy=doctor1.id
    )
    
    patient2 = Patient(
        firstName='Bob',
        lastName='Johnson',
        dateOfBirth='1970-10-20',
        gender='Male',
        email='bob.johnson@example.com',
        phone='555-987-6543',
        address='456 Oak Ave, Townsburg, ST 67890',
        insuranceId='INS67890',
        medicalConditions=['Type 2 Diabetes', 'Arthritis'],
        allergies=['Sulfa'],
        notes='Patient needs regular blood sugar monitoring.',
        createdBy=doctor2.id
    )
    
    patient3 = Patient(
        firstName='Carol',
        lastName='Martinez',
        dateOfBirth='1990-03-12',
        gender='Female',
        email='carol.martinez@example.com',
        phone='555-456-7890',
        address='789 Pine Blvd, Villageton, ST 54321',
        insuranceId='INS54321',
        medicalConditions=['Anxiety', 'Migraines'],
        allergies=['Latex'],
        notes='Patient takes preventive medication for migraines.',
        createdBy=doctor1.id
    )
    
    db.session.add_all([patient1, patient2, patient3])
    db.session.commit()
    
    # Create appointments
    appointment1 = Appointment(
        patientId=patient1.id,
        doctorId=doctor1.id,
        appointmentDate='2025-04-15',
        startTime='09:00:00',
        endTime='09:30:00',
        status='Scheduled',
        reason='Annual physical exam',
        notes='Patient requested early morning appointment'
    )
    
    appointment2 = Appointment(
        patientId=patient2.id,
        doctorId=doctor2.id,
        appointmentDate='2025-04-16',
        startTime='14:00:00',
        endTime='14:30:00',
        status='Scheduled',
        reason='Diabetes follow-up',
        notes='Check A1C levels'
    )
    
    appointment3 = Appointment(
        patientId=patient3.id,
        doctorId=doctor1.id,
        appointmentDate='2025-04-10',
        startTime='11:00:00',
        endTime='11:30:00',
        status='Completed',
        reason='Migraine consultation',
        notes='Discuss possible preventive therapy options'
    )
    
    db.session.add_all([appointment1, appointment2, appointment3])
    db.session.commit()
    
    # Create medications
    medication1 = Medication(
        patientId=patient1.id,
        name='Ventolin HFA',
        dosage='90 mcg',
        frequency='As needed, 2 puffs',
        startDate='2024-10-15',
        endDate=None,  # Ongoing medication
        prescribedBy=doctor1.id,
        notes='Use for asthma attacks or before exercise'
    )
    
    medication2 = Medication(
        patientId=patient1.id,
        name='Lisinopril',
        dosage='10 mg',
        frequency='Once daily',
        startDate='2024-11-01',
        endDate=None,  # Ongoing medication
        prescribedBy=doctor1.id,
        notes='Take for blood pressure control'
    )
    
    medication3 = Medication(
        patientId=patient2.id,
        name='Metformin',
        dosage='500 mg',
        frequency='Twice daily with meals',
        startDate='2024-09-20',
        endDate=None,  # Ongoing medication
        prescribedBy=doctor2.id,
        notes='For diabetes management'
    )
    
    medication4 = Medication(
        patientId=patient3.id,
        name='Sumatriptan',
        dosage='50 mg',
        frequency='As needed for migraine, max 200mg per day',
        startDate='2025-01-05',
        endDate=None,  # Ongoing medication
        prescribedBy=doctor1.id,
        notes='Take at first sign of migraine'
    )
    
    db.session.add_all([medication1, medication2, medication3, medication4])
    db.session.commit()
    
    # Create medical records
    record1 = MedicalRecord(
        patientId=patient1.id,
        doctorId=doctor1.id,
        visitDate='2025-01-15',
        chiefComplaint='Shortness of breath, wheezing',
        diagnosis='Moderate asthma exacerbation',
        treatmentPlan='Increased inhaler use, added oral steroid for 5 days',
        followUpNeeded=True,
        notes='Patient showing improvement with current regimen'
    )
    
    record2 = MedicalRecord(
        patientId=patient2.id,
        doctorId=doctor2.id,
        visitDate='2025-02-10',
        chiefComplaint='Elevated blood sugar readings',
        diagnosis='Poorly controlled Type 2 Diabetes',
        treatmentPlan='Adjusted medication dosage, dietary counseling, daily glucose monitoring',
        followUpNeeded=True,
        notes='Patient needs to maintain food diary'
    )
    
    record3 = MedicalRecord(
        patientId=patient3.id,
        doctorId=doctor1.id,
        visitDate='2025-03-05',
        chiefComplaint='Severe headache, visual aura, nausea',
        diagnosis='Migraine with aura',
        treatmentPlan='Prescribed acute medication, trigger avoidance education',
        followUpNeeded=True,
        notes='Discussed possible preventive therapy options'
    )
    
    db.session.add_all([record1, record2, record3])
    db.session.commit()
    
    return jsonify({
        'message': 'Database seeded successfully',
        'users': len([admin, doctor1, doctor2, nurse, receptionist, patient_user]),
        'patients': len([patient1, patient2, patient3]),
        'appointments': len([appointment1, appointment2, appointment3]),
        'medications': len([medication1, medication2, medication3, medication4]),
        'medical_records': len([record1, record2, record3])
    })

@app.route('/api/demo/patients', methods=['GET'])
def demo_get_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

if __name__ == '__main__':
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Check if admin user already exists and create test users if needed
        admin_exists = User.query.filter_by(username='admin').first() is not None
        
        if not admin_exists:
            print("Creating admin user...")
            admin_user = User(
                id=str(uuid.uuid4()),
                username='admin',
                password='password123',  # In a real app, this would be hashed
                firstName='Admin',
                lastName='User',
                email='admin@example.com',
                role='ADMIN'
            )
            db.session.add(admin_user)
            
            # Create a test doctor user
            doctor_user = User(
                id=str(uuid.uuid4()),
                username='doctor',
                password='password123',  # In a real app, this would be hashed
                firstName='John',
                lastName='Smith',
                email='doctor@example.com',
                role='DOCTOR'
            )
            db.session.add(doctor_user)
            
            # Commit the changes
            db.session.commit()
            print("Test users created successfully!")
        else:
            print("Admin user already exists, skipping user creation.")
        
        print("Database tables created successfully!")
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)


    # Test the database connection
@app.route('/api/db-test', methods=['GET'])
def test_db_connection():
    try:
        # Attempt to make a simple database query
        result = db.session.execute(db.select(User).limit(1)).first()
        return jsonify({
            "status": "success",
            "message": "Database connection successful",
            "database_type": db.engine.name,
            "result": f"Found user: {result[0].username}" if result else "No users found"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(e)
        }), 500