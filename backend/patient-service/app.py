import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from datetime import datetime
import uuid
import boto3
from werkzeug.utils import secure_filename
import base64
import json

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
    insuranceId = db.Column(db.String(50), nullable=False)
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

# Helper function to check user authorization
def authorize(required_permission):
    def decorator(func):
        def wrapper(*args, **kwargs):
            # For simplicity in this prototype, we'll use a header to identify the user
            user_id = request.headers.get('X-User-ID')
            if not user_id:
                return jsonify({'message': 'Unauthorized - User ID not provided'}), 401
            
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

# API Endpoints
@app.route('/api/patients', methods=['GET'])
@authorize('read')
def get_all_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

@app.route('/api/patients/<string:id>', methods=['GET'])
@authorize('read')
def get_patient(id):
    patient = Patient.query.get(id)
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
    
    # Convert string arrays to lists if they are strings
    if 'medicalConditions' in data and isinstance(data['medicalConditions'], str):
        data['medicalConditions'] = [condition.strip() for condition in data['medicalConditions'].split(',')]
    
    if 'allergies' in data and isinstance(data['allergies'], str):
        data['allergies'] = [allergy.strip() for allergy in data['allergies'].split(',')]
    
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
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    # For users with role "NURSE" or "RECEPTIONIST", they can only update basic information
    if request.user.role in ['NURSE', 'RECEPTIONIST']:
        allowed_fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'notes']
        data = {k: v for k, v in request.get_json().items() if k in allowed_fields}
    else:
        data = request.get_json()
    
    # Convert string arrays to lists if they are strings
    if 'medicalConditions' in data and isinstance(data['medicalConditions'], str):
        data['medicalConditions'] = [condition.strip() for condition in data['medicalConditions'].split(',')]
    
    if 'allergies' in data and isinstance(data['allergies'], str):
        data['allergies'] = [allergy.strip() for allergy in data['allergies'].split(',')]
    
    # Process profile image if provided
    if 'profileImage' in data and data['profileImage'] and data['profileImage'].startswith('data:'):
        profile_image_url = upload_base64_to_s3(data['profileImage'])
        if profile_image_url:
            patient.profileImageUrl = profile_image_url
    
    # Update patient attributes
    for key, value in data.items():
        if key != 'profileImage' and hasattr(patient, key):
            setattr(patient, key, value)
    
    db.session.commit()
    
    return jsonify(patient.to_dict())

@app.route('/api/patients/<string:id>', methods=['DELETE'])
@authorize('delete')
def delete_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    db.session.delete(patient)
    db.session.commit()
    
    return '', 204

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
    
    images = MedicalImage.query.filter_by(patientId=patient_id).all()
    return jsonify([image.to_dict() for image in images])

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
@app.cli.command("seed-db")
def seed_db():
    """Seed the database with initial data."""
    print("Seeding database with sample users and patients...")
    
    # Clear existing data
    db.session.query(MedicalImage).delete()
    db.session.query(Patient).delete()
    db.session.query(User).delete()
    
    # Sample users
    users = [
        User(
            id='1',
            username='admin',
            password='admin123',  # In a real app, hash this
            firstName='Admin',
            lastName='User',
            email='admin@example.com',
            role='ADMIN'
        ),
        User(
            id='2',
            username='doctor',
            password='doctor123',  # In a real app, hash this
            firstName='Doctor',
            lastName='Smith',
            email='doctor@example.com',
            role='DOCTOR'
        ),
        User(
            id='3',
            username='nurse',
            password='nurse123',  # In a real app, hash this
            firstName='Nurse',
            lastName='Johnson',
            email='nurse@example.com',
            role='NURSE'
        ),
        User(
            id='4',
            username='receptionist',
            password='reception123',  # In a real app, hash this
            firstName='Front',
            lastName='Desk',
            email='reception@example.com',
            role='RECEPTIONIST'
        ),
        User(
            id='5',
            username='patient',
            password='patient123',  # In a real app, hash this
            firstName='Patient',
            lastName='User',
            email='patient@example.com',
            role='PATIENT'
        )
    ]
    
    for user in users:
        db.session.add(user)
    
    # Sample patients
    patients = [
        Patient(
            id='1',
            firstName='John',
            lastName='Doe',
            dateOfBirth='1980-05-15',
            gender='Male',
            email='john.doe@example.com',
            phone='(555) 123-4567',
            address='123 Main St, Anytown, USA',
            insuranceId='INS-12345',
            medicalConditions=['Hypertension', 'Asthma'],
            allergies=['Penicillin'],
            notes='Patient prefers morning appointments',
            createdBy='2'  # Doctor created this record
        ),
        Patient(
            id='2',
            firstName='Jane',
            lastName='Smith',
            dateOfBirth='1975-08-21',
            gender='Female',
            email='jane.smith@example.com',
            phone='(555) 987-6543',
            address='456 Oak Ave, Somewhere, USA',
            insuranceId='INS-67890',
            medicalConditions=['Diabetes Type 2'],
            allergies=['Sulfa', 'Shellfish'],
            notes='Regular checkup needed every 3 months',
            createdBy='2'  # Doctor created this record
        ),
        Patient(
            id='3',
            firstName='Patient',
            lastName='User',
            dateOfBirth='1990-03-10',
            gender='Male',
            email='patient@example.com',
            phone='(555) 555-5555',
            address='789 Pine St, Anywhere, USA',
            insuranceId='INS-54321',
            medicalConditions=['Allergic Rhinitis'],
            allergies=['Pollen', 'Dust'],
            notes='Patient records are only visible to themselves and medical staff',
            createdBy='5'  # Self-registered patient
        )
    ]
    
    for patient in patients:
        db.session.add(patient)
    
    db.session.commit()
    print("Database seeded successfully!")

# Simple route to bypass authentication for demo purposes
@app.route('/api/demo/patients', methods=['GET'])
def demo_get_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
