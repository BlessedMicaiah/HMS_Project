import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from app import db, User, Patient, MedicalImage, Appointment, Medication, MedicalRecord

# Define GraphQL Types based on SQLAlchemy Models
class UserType(SQLAlchemyObjectType):
    class Meta:
        model = User
        interfaces = (graphene.relay.Node,)
        exclude_fields = ('password',)  # Don't expose passwords

class PatientType(SQLAlchemyObjectType):
    class Meta:
        model = Patient
        interfaces = (graphene.relay.Node,)
        
class MedicalImageType(SQLAlchemyObjectType):
    class Meta:
        model = MedicalImage
        interfaces = (graphene.relay.Node,)

class AppointmentType(SQLAlchemyObjectType):
    class Meta:
        model = Appointment
        interfaces = (graphene.relay.Node,)

class MedicationType(SQLAlchemyObjectType):
    class Meta:
        model = Medication
        interfaces = (graphene.relay.Node,)

class MedicalRecordType(SQLAlchemyObjectType):
    class Meta:
        model = MedicalRecord
        interfaces = (graphene.relay.Node,)

# Define Query Class for retrieving data
class Query(graphene.ObjectType):
    # Fields
    node = graphene.relay.Node.Field()
    
    # Individual element queries
    user = graphene.Field(UserType, id=graphene.ID())
    patient = graphene.Field(PatientType, id=graphene.ID())
    medical_image = graphene.Field(MedicalImageType, id=graphene.ID())
    appointment = graphene.Field(AppointmentType, id=graphene.ID())
    medication = graphene.Field(MedicationType, id=graphene.ID())
    medical_record = graphene.Field(MedicalRecordType, id=graphene.ID())
    
    # Collection queries
    all_users = graphene.List(UserType)
    all_patients = graphene.List(PatientType, 
                                search=graphene.String(), 
                                limit=graphene.Int(), 
                                offset=graphene.Int())
    all_medical_images = graphene.List(MedicalImageType, patient_id=graphene.ID())
    all_appointments = graphene.List(AppointmentType, 
                                    patient_id=graphene.ID(),
                                    doctor_id=graphene.ID(), 
                                    date=graphene.String())
    all_medications = graphene.List(MedicationType, patient_id=graphene.ID())
    all_medical_records = graphene.List(MedicalRecordType, patient_id=graphene.ID())
    
    # Resolvers for individual elements
    def resolve_user(self, info, id):
        return User.query.get(id)
    
    def resolve_patient(self, info, id):
        return Patient.query.get(id)
    
    def resolve_medical_image(self, info, id):
        return MedicalImage.query.get(id)
    
    def resolve_appointment(self, info, id):
        return Appointment.query.get(id)
    
    def resolve_medication(self, info, id):
        return Medication.query.get(id)
    
    def resolve_medical_record(self, info, id):
        return MedicalRecord.query.get(id)
    
    # Resolvers for collections
    def resolve_all_users(self, info):
        return User.query.all()
    
    def resolve_all_patients(self, info, search=None, limit=None, offset=None):
        query = Patient.query
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Patient.firstName.ilike(search_term),
                    Patient.lastName.ilike(search_term),
                    Patient.email.ilike(search_term)
                )
            )
        
        # Apply pagination
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
            
        return query.all()
    
    def resolve_all_medical_images(self, info, patient_id=None):
        query = MedicalImage.query
        if patient_id:
            query = query.filter_by(patientId=patient_id)
        return query.all()
    
    def resolve_all_appointments(self, info, patient_id=None, doctor_id=None, date=None):
        query = Appointment.query
        
        if patient_id:
            query = query.filter_by(patientId=patient_id)
        if doctor_id:
            query = query.filter_by(doctorId=doctor_id)
        if date:
            query = query.filter_by(appointmentDate=date)
            
        return query.order_by(Appointment.appointmentDate, Appointment.startTime).all()
    
    def resolve_all_medications(self, info, patient_id=None):
        query = Medication.query
        if patient_id:
            query = query.filter_by(patientId=patient_id)
        return query.all()
    
    def resolve_all_medical_records(self, info, patient_id=None):
        query = MedicalRecord.query
        if patient_id:
            query = query.filter_by(patientId=patient_id)
        return query.order_by(MedicalRecord.visitDate.desc()).all()

# Input Types for Mutations
class PatientInput(graphene.InputObjectType):
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)
    date_of_birth = graphene.String(required=True)
    gender = graphene.String(required=True)
    email = graphene.String(required=True)
    phone = graphene.String(required=True)
    address = graphene.String(required=True)
    insurance_id = graphene.String()
    medical_conditions = graphene.List(graphene.String)
    allergies = graphene.List(graphene.String)
    notes = graphene.String()
    profile_image_url = graphene.String()
    created_by = graphene.String()

class AppointmentInput(graphene.InputObjectType):
    patient_id = graphene.ID(required=True)
    doctor_id = graphene.ID(required=True)
    appointment_date = graphene.String(required=True)
    start_time = graphene.String(required=True)
    end_time = graphene.String(required=True)
    status = graphene.String(required=True)
    reason = graphene.String(required=True)
    notes = graphene.String()

class MedicationInput(graphene.InputObjectType):
    patient_id = graphene.ID(required=True)
    name = graphene.String(required=True)
    dosage = graphene.String(required=True)
    frequency = graphene.String(required=True)
    start_date = graphene.String(required=True)
    end_date = graphene.String()
    prescribed_by = graphene.String(required=True)
    notes = graphene.String()

class MedicalRecordInput(graphene.InputObjectType):
    patient_id = graphene.ID(required=True)
    doctor_id = graphene.ID(required=True)
    visit_date = graphene.String(required=True)
    chief_complaint = graphene.String(required=True)
    diagnosis = graphene.String(required=True)
    treatment_plan = graphene.String(required=True)
    follow_up_needed = graphene.Boolean()
    notes = graphene.String()

# Mutations for creating/updating data
class CreatePatient(graphene.Mutation):
    class Arguments:
        patient_data = PatientInput(required=True)
    
    patient = graphene.Field(lambda: PatientType)
    
    def mutate(self, info, patient_data):
        patient = Patient(
            firstName=patient_data.first_name,
            lastName=patient_data.last_name,
            dateOfBirth=patient_data.date_of_birth,
            gender=patient_data.gender,
            email=patient_data.email,
            phone=patient_data.phone,
            address=patient_data.address,
            insuranceId=patient_data.insurance_id,
            medicalConditions=patient_data.medical_conditions if patient_data.medical_conditions else [],
            allergies=patient_data.allergies if patient_data.allergies else [],
            notes=patient_data.notes,
            profileImageUrl=patient_data.profile_image_url,
            createdBy=patient_data.created_by
        )
        
        db.session.add(patient)
        db.session.commit()
        
        return CreatePatient(patient=patient)

class UpdatePatient(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        patient_data = PatientInput(required=True)
    
    patient = graphene.Field(lambda: PatientType)
    
    def mutate(self, info, id, patient_data):
        patient = Patient.query.get(id)
        if not patient:
            raise Exception(f"Patient with ID {id} not found")
        
        # Update fields
        if hasattr(patient_data, 'first_name') and patient_data.first_name:
            patient.firstName = patient_data.first_name
        if hasattr(patient_data, 'last_name') and patient_data.last_name:
            patient.lastName = patient_data.last_name
        if hasattr(patient_data, 'date_of_birth') and patient_data.date_of_birth:
            patient.dateOfBirth = patient_data.date_of_birth
        if hasattr(patient_data, 'gender') and patient_data.gender:
            patient.gender = patient_data.gender
        if hasattr(patient_data, 'email') and patient_data.email:
            patient.email = patient_data.email
        if hasattr(patient_data, 'phone') and patient_data.phone:
            patient.phone = patient_data.phone
        if hasattr(patient_data, 'address') and patient_data.address:
            patient.address = patient_data.address
        if hasattr(patient_data, 'insurance_id'):
            patient.insuranceId = patient_data.insurance_id
        if hasattr(patient_data, 'medical_conditions') and patient_data.medical_conditions is not None:
            patient.medicalConditions = patient_data.medical_conditions
        if hasattr(patient_data, 'allergies') and patient_data.allergies is not None:
            patient.allergies = patient_data.allergies
        if hasattr(patient_data, 'notes'):
            patient.notes = patient_data.notes
        if hasattr(patient_data, 'profile_image_url'):
            patient.profileImageUrl = patient_data.profile_image_url
        
        db.session.commit()
        
        return UpdatePatient(patient=patient)

class DeletePatient(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        patient = Patient.query.get(id)
        if not patient:
            raise Exception(f"Patient with ID {id} not found")
        
        db.session.delete(patient)
        db.session.commit()
        
        return DeletePatient(success=True)

class CreateAppointment(graphene.Mutation):
    class Arguments:
        appointment_data = AppointmentInput(required=True)
    
    appointment = graphene.Field(lambda: AppointmentType)
    
    def mutate(self, info, appointment_data):
        appointment = Appointment(
            patientId=appointment_data.patient_id,
            doctorId=appointment_data.doctor_id,
            appointmentDate=appointment_data.appointment_date,
            startTime=appointment_data.start_time,
            endTime=appointment_data.end_time,
            status=appointment_data.status,
            reason=appointment_data.reason,
            notes=appointment_data.notes
        )
        
        db.session.add(appointment)
        db.session.commit()
        
        return CreateAppointment(appointment=appointment)

class CreateMedication(graphene.Mutation):
    class Arguments:
        medication_data = MedicationInput(required=True)
    
    medication = graphene.Field(lambda: MedicationType)
    
    def mutate(self, info, medication_data):
        medication = Medication(
            patientId=medication_data.patient_id,
            name=medication_data.name,
            dosage=medication_data.dosage,
            frequency=medication_data.frequency,
            startDate=medication_data.start_date,
            endDate=medication_data.end_date,
            prescribedBy=medication_data.prescribed_by,
            notes=medication_data.notes
        )
        
        db.session.add(medication)
        db.session.commit()
        
        return CreateMedication(medication=medication)

class CreateMedicalRecord(graphene.Mutation):
    class Arguments:
        record_data = MedicalRecordInput(required=True)
    
    medical_record = graphene.Field(lambda: MedicalRecordType)
    
    def mutate(self, info, record_data):
        record = MedicalRecord(
            patientId=record_data.patient_id,
            doctorId=record_data.doctor_id,
            visitDate=record_data.visit_date,
            chiefComplaint=record_data.chief_complaint,
            diagnosis=record_data.diagnosis,
            treatmentPlan=record_data.treatment_plan,
            followUpNeeded=record_data.follow_up_needed if record_data.follow_up_needed is not None else False,
            notes=record_data.notes
        )
        
        db.session.add(record)
        db.session.commit()
        
        return CreateMedicalRecord(medical_record=record)

# Define the Mutation class with all mutations
class Mutation(graphene.ObjectType):
    create_patient = CreatePatient.Field()
    update_patient = UpdatePatient.Field()
    delete_patient = DeletePatient.Field()
    create_appointment = CreateAppointment.Field()
    create_medication = CreateMedication.Field()
    create_medical_record = CreateMedicalRecord.Field()

# Create the Schema
schema = graphene.Schema(query=Query, mutation=Mutation)
