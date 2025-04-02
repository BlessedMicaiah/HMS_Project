import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import uuid
import json

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patient_service.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

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
    medicalConditions = db.Column(db.Text, default='[]')  # Store as JSON string
    allergies = db.Column(db.Text, default='[]')  # Store as JSON string
    notes = db.Column(db.Text, nullable=True)
    profileImageUrl = db.Column(db.String(500), nullable=True)
    
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
            'medicalConditions': json.loads(self.medicalConditions or '[]'),
            'allergies': json.loads(self.allergies or '[]'),
            'notes': self.notes,
            'profileImageUrl': self.profileImageUrl
        }

# API Endpoints
@app.route('/api/patients', methods=['GET'])
def get_all_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

@app.route('/api/patients/<string:id>', methods=['GET'])
def get_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    return jsonify(patient.to_dict())

@app.route('/api/patients', methods=['POST'])
def create_patient():
    data = request.get_json()
    
    # Process arrays
    medical_conditions = data.get('medicalConditions', [])
    if isinstance(medical_conditions, str):
        medical_conditions = [condition.strip() for condition in medical_conditions.split(',')]
    
    allergies = data.get('allergies', [])
    if isinstance(allergies, str):
        allergies = [allergy.strip() for allergy in allergies.split(',')]
    
    new_patient = Patient(
        firstName=data.get('firstName'),
        lastName=data.get('lastName'),
        dateOfBirth=data.get('dateOfBirth'),
        gender=data.get('gender'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        insuranceId=data.get('insuranceId'),
        medicalConditions=json.dumps(medical_conditions),
        allergies=json.dumps(allergies),
        notes=data.get('notes', ''),
        profileImageUrl=data.get('profileImageUrl')
    )
    
    db.session.add(new_patient)
    db.session.commit()
    
    return jsonify(new_patient.to_dict()), 201

@app.route('/api/patients/<string:id>', methods=['PUT'])
def update_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    data = request.get_json()
    
    # Process arrays
    if 'medicalConditions' in data:
        medical_conditions = data['medicalConditions']
        if isinstance(medical_conditions, str):
            medical_conditions = [condition.strip() for condition in medical_conditions.split(',')]
        patient.medicalConditions = json.dumps(medical_conditions)
    
    if 'allergies' in data:
        allergies = data['allergies']
        if isinstance(allergies, str):
            allergies = [allergy.strip() for allergy in allergies.split(',')]
        patient.allergies = json.dumps(allergies)
    
    # Update other fields
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
    if 'notes' in data:
        patient.notes = data['notes']
    if 'profileImageUrl' in data:
        patient.profileImageUrl = data['profileImageUrl']
    
    db.session.commit()
    
    return jsonify(patient.to_dict())

@app.route('/api/patients/<string:id>', methods=['DELETE'])
def delete_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    db.session.delete(patient)
    db.session.commit()
    
    return '', 204

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'UP',
        'service': 'patient-service'
    }), 200

# Demo route for testing without authentication
@app.route('/api/demo/patients', methods=['GET'])
def demo_get_patients():
    patients = Patient.query.all()
    return jsonify([patient.to_dict() for patient in patients])

@app.route('/api/demo/patients', methods=['POST'])
def demo_create_patient():
    data = request.get_json()
    
    medical_conditions = data.get('medicalConditions', [])
    if isinstance(medical_conditions, str):
        medical_conditions = [condition.strip() for condition in medical_conditions.split(',')]
    
    allergies = data.get('allergies', [])
    if isinstance(allergies, str):
        allergies = [allergy.strip() for allergy in allergies.split(',')]
    
    new_patient = Patient(
        firstName=data.get('firstName'),
        lastName=data.get('lastName'),
        dateOfBirth=data.get('dateOfBirth'),
        gender=data.get('gender'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        insuranceId=data.get('insuranceId'),
        medicalConditions=json.dumps(medical_conditions),
        allergies=json.dumps(allergies),
        notes=data.get('notes', ''),
        profileImageUrl=data.get('profileImageUrl')
    )
    
    db.session.add(new_patient)
    db.session.commit()
    
    return jsonify(new_patient.to_dict()), 201

@app.route('/api/demo/patients/<string:id>', methods=['GET'])
def demo_get_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    return jsonify(patient.to_dict())

@app.route('/api/demo/patients/<string:id>', methods=['PUT'])
def demo_update_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    data = request.get_json()
    
    # Process arrays
    if 'medicalConditions' in data:
        medical_conditions = data['medicalConditions']
        if isinstance(medical_conditions, str):
            medical_conditions = [condition.strip() for condition in medical_conditions.split(',')]
        patient.medicalConditions = json.dumps(medical_conditions)
    
    if 'allergies' in data:
        allergies = data['allergies']
        if isinstance(allergies, str):
            allergies = [allergy.strip() for allergy in allergies.split(',')]
        patient.allergies = json.dumps(allergies)
    
    # Update other fields
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
    if 'notes' in data:
        patient.notes = data['notes']
    if 'profileImageUrl' in data:
        patient.profileImageUrl = data['profileImageUrl']
    
    db.session.commit()
    return jsonify(patient.to_dict())

@app.route('/api/demo/patients/<string:id>', methods=['DELETE'])
def demo_delete_patient(id):
    patient = Patient.query.get(id)
    if not patient:
        return jsonify({'message': 'Patient not found'}), 404
    
    db.session.delete(patient)
    db.session.commit()
    return jsonify({'message': 'Patient deleted successfully'})

# Initialize database and seed with data
@app.cli.command("init-db")
def init_db():
    """Initialize the database and seed with sample data."""
    # Create tables
    db.create_all()
    
    # Check if there are existing patients
    if Patient.query.first():
        print("Database already seeded.")
        return
    
    print("Seeding database with sample patients...")
    
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
            medicalConditions=json.dumps(['Hypertension', 'Asthma']),
            allergies=json.dumps(['Penicillin']),
            notes='Patient prefers morning appointments'
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
            medicalConditions=json.dumps(['Diabetes Type 2']),
            allergies=json.dumps(['Sulfa', 'Shellfish']),
            notes='Regular checkup needed every 3 months'
        )
    ]
    
    for patient in patients:
        db.session.add(patient)
    
    db.session.commit()
    print("Database seeded successfully!")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=True)
