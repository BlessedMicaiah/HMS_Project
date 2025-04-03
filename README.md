# Healthcare Management System (HMS)

A comprehensive healthcare management solution built using microservices architecture based on the C4 Model.

## Project Structure

The project is organized following the architecture described in the C4 Model:

- **Frontend**: React-based web application for patient management interface
- **Backend**:
  - **API Gateway**: Centralized entry point for all client requests
  - **Patient Service**: Manages patient data and medical records

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

### Backend Setup

1. Navigate to the backend directory: `cd backend`
2. Install dependencies for API Gateway: `cd api-gateway && npm install`
3. Install dependencies for Patient Service: `cd ../patient-service && npm install`
4. Start the development servers (from the backend directory):
   - API Gateway: `cd api-gateway && npm start`
   - Patient Service: `cd ../patient-service && npm start`

## MVP Features

- Patient management (CRUD operations)
- Basic user interface for healthcare providers
- Initial API implementation for patient data
- Secure doctor login with role-based access control

## Authentication

The system implements a secure authentication system for healthcare professionals:

- **Login Page**: Doctors can log in using their ID and password
- **Role-Based Access**: Different user roles (Admin, Doctor, Nurse) have appropriate access levels
- **Protected Routes**: All healthcare data is protected behind authentication
- **Mock Users**: For development, you can use the following credentials:
  - Username: `doctor` (Role: Doctor) - Password: any
  - Username: `admin` (Role: Admin) - Password: any

## Architecture

This project follows the C4 Model architecture with:

- System Context: Healthcare system with patients, providers, and external interfaces
- Container: Microservices for different healthcare functions
- Component: Modular design within each service

## Database Design and Implementation

The Healthcare Management System uses a relational database with the following tables:

### Core Tables
1. **Users**
   - Manages authentication and authorization
   - Fields: id, username, password, firstName, lastName, email, role, createdAt, updatedAt

2. **Patients**
   - Stores patient demographic and medical information
   - Fields: id, firstName, lastName, dateOfBirth, gender, email, phone, address, insuranceId, medicalConditions, allergies, notes, profileImageUrl, createdAt, updatedAt, createdBy

3. **Medical Images**
   - Contains references to patient diagnostic images
   - Fields: id, patientId, imageUrl, imageType, description, uploadedAt, uploadedBy

### Additional Tables
4. **Appointments**
   - Tracks scheduled patient appointments
   - Fields: id, patientId, doctorId, appointmentDate, startTime, endTime, status, reason, notes, createdAt, updatedAt

5. **Medications**
   - Records prescribed medications for patients
   - Fields: id, patientId, name, dosage, frequency, startDate, endDate, prescribedBy, notes, createdAt, updatedAt

6. **Medical Records**
   - Documents patient visits and diagnoses
   - Fields: id, patientId, doctorId, visitDate, chiefComplaint, diagnosis, treatmentPlan, followUpNeeded, notes, createdAt, updatedAt

### Entity-Relationship Diagram
```
┌──────────┐      ┌──────────────┐      ┌───────────────┐
│  Users   │      │   Patients   │      │ Medical Images│
├──────────┤      ├──────────────┤      ├───────────────┤
│ id (PK)  │◄────┐│ id (PK)      │      │ id (PK)       │
│ username │     ││ firstName    │◄────┐│ patientId (FK)│
│ password │     ││ lastName     │     ││ imageUrl      │
│ firstName│     ││ dateOfBirth  │     ││ imageType     │
│ lastName │     ││ ...          │     ││ description   │
│ email    │     │└──────────────┘     ││ uploadedAt    │
│ role     │     │                     ││ uploadedBy(FK)│
└──────────┘     │                     │└───────────────┘
                 │                     │
┌─────────────┐  │  ┌─────────────┐    │  ┌───────────────┐
│ Appointments│  │ │ Medications │     │  │   Medical     │
├─────────────┤  │  ├─────────────┤    │  │   Records     │
│ id (PK)     │  │  │ id (PK)     │    │  ├────────────── ┤
│ patientId(FK)◄─┘ │ patientId(FK)◄──  ┘  │ id (PK)       │
│ doctorId(FK)◄──┐  │ name        │       │ patientId(FK)◄──┐
│ appointmentDate│  │ dosage      │       │ doctorId(FK)◄───┤
│ startTime    │    │ frequency   │       │ visitDate     │ │
│ endTime      │    │ startDate   │       │ diagnosis     │ │
│ status       │    │ endDate     │       │ treatmentPlan │ │
│ reason       │    │ prescribedBy│       │ notes         │ │
│ notes        │    │ notes       │       └───────────────┘ │
└─────────────┘     └─────────────┘                         │
                                                            │
                                                            │

## API Documentation

The Healthcare Management System provides a comprehensive REST API that follows industry best practices:

### API Design Principles

- **RESTful Architecture**: All endpoints adhere to REST conventions
- **Resource-Based URLs**: Clear, hierarchical structure (e.g., `/api/patients`, `/api/appointments`)
- **Proper HTTP Verbs**: GET, POST, PUT, DELETE used appropriately for CRUD operations
- **Consistent Status Codes**: Proper HTTP status codes returned (201 for creation, 404 for not found, etc.)
- **JSON Responses**: All API responses are in consistent JSON format
- **Pagination Support**: Efficient handling of large datasets with cursor-based pagination
- **Error Handling**: Detailed error messages with appropriate status codes

### Pagination

All collection endpoints support pagination to efficiently handle large datasets:

- **Query Parameters**:
  - `page`: The page number to retrieve (default: 1)
  - `per_page`: Number of items per page (default: 10, max: 100)

- **Response Format**:
  ```json
  {
    "data": [...],  // Array of resources
    "pagination": {
      "total": 50,           // Total number of items
      "per_page": 10,        // Items per page
      "current_page": 1,     // Current page number
      "total_pages": 5,      // Total number of pages
      "has_next": true,      // Whether there's a next page
      "has_prev": false      // Whether there's a previous page
    }
  }
  ```

### Available Endpoints

#### Patient Management
- `GET /api/patients` - Retrieve all patients (paginated)
- `GET /api/patients/{id}` - Retrieve a specific patient
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/{id}` - Update an existing patient
- `DELETE /api/patients/{id}` - Delete a patient
- `GET /api/patients/{id}/images` - Retrieve patient images (paginated)

#### Appointment Management
- `GET /api/appointments` - Retrieve all appointments (paginated)
- `GET /api/appointments/{id}` - Retrieve a specific appointment
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/{id}` - Update an existing appointment
- `DELETE /api/appointments/{id}` - Delete an appointment

#### Medication Management
- `GET /api/medications` - Retrieve all medications (paginated)
- `GET /api/medications/{id}` - Retrieve a specific medication
- `POST /api/medications` - Create a new medication
- `PUT /api/medications/{id}` - Update an existing medication
- `DELETE /api/medications/{id}` - Delete a medication

#### Medical Record Management
- `GET /api/medical-records` - Retrieve all medical records (paginated)
- `GET /api/medical-records/{id}` - Retrieve a specific medical record
- `POST /api/medical-records` - Create a new medical record
- `PUT /api/medical-records/{id}` - Update an existing medical record
- `DELETE /api/medical-records/{id}` - Delete a medical record

### Authentication & Authorization

All API endpoints are protected with role-based access control:
- Authentication via JWT tokens
- User roles determine access permissions
- Custom request headers (X-User-ID) for user-specific filtering

### Future API Enhancements
- Implement filtering and sorting capabilities
- Add versioning support
- Rate limiting
- HATEOAS compliance

## MVP Features

- Patient management (CRUD operations)
- Basic user interface for healthcare providers
- Initial API implementation for patient data
- Secure doctor login with role-based access control
