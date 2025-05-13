from flask import Flask
from flask_restx import Api, Resource, fields, Namespace
import app as patient_app
from flask_cors import CORS

# Initialize Flask app
flask_app = Flask(__name__)
# Update CORS configuration to be more permissive during development
CORS(flask_app, origins=['*'], supports_credentials=True, allow_headers=['Content-Type', 'X-User-ID', 'Authorization'])

# Initialize Swagger API with documentation 
api = Api(flask_app, version='1.0', title='Healthcare Management System API',
          description='A comprehensive API for healthcare management',
          doc='/',
          authorizations={
              'Bearer Auth': {
                  'type': 'apiKey',
                  'in': 'header',
                  'name': 'Authorization'
              }
          },
          security='Bearer Auth'
)

# Create namespaces for different resource groups
patients_ns = api.namespace('patients', description='Patient operations')
appointments_ns = api.namespace('appointments', description='Appointment operations')
medications_ns = api.namespace('medications', description='Medication operations')
medical_records_ns = api.namespace('medical-records', description='Medical record operations')
auth_ns = api.namespace('auth', description='Authentication operations')

# Model definitions for documentation
patient_model = api.model('Patient', {
    'firstName': fields.String(required=True, description='Patient first name'),
    'lastName': fields.String(required=True, description='Patient last name'),
    'dateOfBirth': fields.String(required=True, description='Date of birth (YYYY-MM-DD)'),
    'gender': fields.String(required=True, description='Patient gender'),
    'email': fields.String(required=True, description='Patient email address'),
    'phone': fields.String(required=True, description='Patient phone number'),
    'address': fields.String(required=True, description='Patient address'),
    'insuranceId': fields.String(description='Insurance ID number'),
    'medicalConditions': fields.List(fields.String, description='List of medical conditions'),
    'allergies': fields.List(fields.String, description='List of allergies'),
    'notes': fields.String(description='Additional notes'),
    'profileImageUrl': fields.String(description='URL to profile image')
})

appointment_model = api.model('Appointment', {
    'patientId': fields.String(required=True, description='Patient ID'),
    'doctorId': fields.String(required=True, description='Doctor ID'),
    'appointmentDate': fields.String(required=True, description='Appointment date (YYYY-MM-DD)'),
    'startTime': fields.String(required=True, description='Start time (HH:MM:SS)'),
    'endTime': fields.String(required=True, description='End time (HH:MM:SS)'),
    'status': fields.String(required=True, description='Appointment status'),
    'reason': fields.String(required=True, description='Reason for appointment'),
    'notes': fields.String(description='Additional notes')
})

medication_model = api.model('Medication', {
    'patientId': fields.String(required=True, description='Patient ID'),
    'name': fields.String(required=True, description='Medication name'),
    'dosage': fields.String(required=True, description='Dosage information'),
    'frequency': fields.String(required=True, description='How often to take'),
    'startDate': fields.String(required=True, description='Start date (YYYY-MM-DD)'),
    'endDate': fields.String(description='End date (YYYY-MM-DD)'),
    'prescribedBy': fields.String(required=True, description='Doctor ID who prescribed'),
    'notes': fields.String(description='Additional notes')
})

medical_record_model = api.model('MedicalRecord', {
    'patientId': fields.String(required=True, description='Patient ID'),
    'doctorId': fields.String(required=True, description='Doctor ID'),
    'visitDate': fields.String(required=True, description='Visit date (YYYY-MM-DD)'),
    'chiefComplaint': fields.String(required=True, description='Chief complaint'),
    'diagnosis': fields.String(required=True, description='Diagnosis details'),
    'treatmentPlan': fields.String(required=True, description='Treatment plan details'),
    'followUpNeeded': fields.Boolean(description='Whether follow-up is needed'),
    'notes': fields.String(description='Additional notes')
})

login_model = api.model('Login', {
    'username': fields.String(required=True, description='Username'),
    'password': fields.String(required=True, description='Password')
})

# PATIENT ENDPOINTS
@patients_ns.route('/')
class PatientList(Resource):
    @patients_ns.doc('list_patients', params={'page': 'Page number', 'per_page': 'Items per page'})
    @api.doc(security='Bearer Auth')
    def get(self):
        """List all patients with pagination"""
        return patient_app.get_all_patients()

    @patients_ns.doc('create_patient')
    @patients_ns.expect(patient_model)
    @api.doc(security='Bearer Auth')
    def post(self):
        """Create a new patient"""
        return patient_app.create_patient()

@patients_ns.route('/<id>')
@patients_ns.param('id', 'The patient identifier')
class Patient(Resource):
    @patients_ns.doc('get_patient')
    @api.doc(security='Bearer Auth')
    def get(self, id):
        """Get a specific patient by ID"""
        return patient_app.get_patient(id)

    @patients_ns.doc('update_patient')
    @patients_ns.expect(patient_model)
    @api.doc(security='Bearer Auth')
    def put(self, id):
        """Update a patient"""
        return patient_app.update_patient(id)

    @patients_ns.doc('delete_patient')
    @api.doc(security='Bearer Auth')
    def delete(self, id):
        """Delete a patient"""
        return patient_app.delete_patient(id)

@patients_ns.route('/<patient_id>/images')
@patients_ns.param('patient_id', 'The patient identifier')
class PatientImages(Resource):
    @patients_ns.doc('get_patient_images')
    @api.doc(security='Bearer Auth')
    def get(self, patient_id):
        """Get all images for a patient"""
        return patient_app.get_patient_images(patient_id)

    @patients_ns.doc('upload_medical_image')
    @api.doc(security='Bearer Auth')
    def post(self, patient_id):
        """Upload a medical image for a patient"""
        return patient_app.upload_medical_image(patient_id)

# APPOINTMENT ENDPOINTS
@appointments_ns.route('/')
class AppointmentList(Resource):
    @appointments_ns.doc('list_appointments', params={'page': 'Page number', 'per_page': 'Items per page', 
                                              'doctorId': 'Filter by doctor', 'patientId': 'Filter by patient',
                                              'startDate': 'Filter by start date', 'endDate': 'Filter by end date'})
    @api.doc(security='Bearer Auth')
    def get(self):
        """List all appointments with optional filters"""
        return patient_app.get_all_appointments()

    @appointments_ns.doc('create_appointment')
    @appointments_ns.expect(appointment_model)
    @api.doc(security='Bearer Auth')
    def post(self):
        """Create a new appointment"""
        return patient_app.create_appointment()

@appointments_ns.route('/<id>')
@appointments_ns.param('id', 'The appointment identifier')
class Appointment(Resource):
    @appointments_ns.doc('get_appointment')
    @api.doc(security='Bearer Auth')
    def get(self, id):
        """Get a specific appointment by ID"""
        return patient_app.get_appointment(id)

    @appointments_ns.doc('update_appointment')
    @appointments_ns.expect(appointment_model)
    @api.doc(security='Bearer Auth')
    def put(self, id):
        """Update an appointment"""
        return patient_app.update_appointment(id)

    @appointments_ns.doc('delete_appointment')
    @api.doc(security='Bearer Auth')
    def delete(self, id):
        """Delete an appointment"""
        return patient_app.delete_appointment(id)

# MEDICATION ENDPOINTS
@medications_ns.route('/')
class MedicationList(Resource):
    @medications_ns.doc('list_medications', params={'page': 'Page number', 'per_page': 'Items per page', 
                                           'patientId': 'Filter by patient'})
    @api.doc(security='Bearer Auth')
    def get(self):
        """List all medications with optional filters"""
        return patient_app.get_all_medications()

    @medications_ns.doc('create_medication')
    @medications_ns.expect(medication_model)
    @api.doc(security='Bearer Auth')
    def post(self):
        """Create a new medication"""
        return patient_app.create_medication()

@medications_ns.route('/<id>')
@medications_ns.param('id', 'The medication identifier')
class Medication(Resource):
    @medications_ns.doc('get_medication')
    @api.doc(security='Bearer Auth')
    def get(self, id):
        """Get a specific medication by ID"""
        return patient_app.get_medication(id)

    @medications_ns.doc('update_medication')
    @medications_ns.expect(medication_model)
    @api.doc(security='Bearer Auth')
    def put(self, id):
        """Update a medication"""
        return patient_app.update_medication(id)

    @medications_ns.doc('delete_medication')
    @api.doc(security='Bearer Auth')
    def delete(self, id):
        """Delete a medication"""
        return patient_app.delete_medication(id)

# MEDICAL RECORD ENDPOINTS
@medical_records_ns.route('/')
class MedicalRecordList(Resource):
    @medical_records_ns.doc('list_medical_records', params={'page': 'Page number', 'per_page': 'Items per page', 
                                                   'patientId': 'Filter by patient'})
    @api.doc(security='Bearer Auth')
    def get(self):
        """List all medical records with optional filters"""
        return patient_app.get_all_medical_records()

    @medical_records_ns.doc('create_medical_record')
    @medical_records_ns.expect(medical_record_model)
    @api.doc(security='Bearer Auth')
    def post(self):
        """Create a new medical record"""
        return patient_app.create_medical_record()

@medical_records_ns.route('/<id>')
@medical_records_ns.param('id', 'The medical record identifier')
class MedicalRecord(Resource):
    @medical_records_ns.doc('get_medical_record')
    @api.doc(security='Bearer Auth')
    def get(self, id):
        """Get a specific medical record by ID"""
        return patient_app.get_medical_record(id)

    @medical_records_ns.doc('update_medical_record')
    @medical_records_ns.expect(medical_record_model)
    @api.doc(security='Bearer Auth')
    def put(self, id):
        """Update a medical record"""
        return patient_app.update_medical_record(id)

    @medical_records_ns.doc('delete_medical_record')
    @api.doc(security='Bearer Auth')
    def delete(self, id):
        """Delete a medical record"""
        return patient_app.delete_medical_record(id)

# AUTH ENDPOINTS
@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.doc('login')
    @auth_ns.expect(login_model)
    def post(self):
        """Login and get JWT token"""
        return patient_app.login()

# Health check endpoint
@api.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Check API health"""
        return patient_app.health_check()

if __name__ == '__main__':
    # Get port from environment variable for deployment platforms
    port = int(os.environ.get('PORT', 5001))
    flask_app.run(host='0.0.0.0', debug=os.environ.get('FLASK_ENV') != 'production', port=port)
