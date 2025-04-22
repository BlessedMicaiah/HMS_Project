# GraphQL API Implementation for HMS

## Overview
This document provides examples and documentation for the newly implemented GraphQL API in the HMS system. GraphQL is a query language for APIs that allows clients to request exactly the data they need, making it more efficient than traditional REST APIs for many use cases.

The GraphQL API is available at the endpoint: `/graphql` 

A GraphiQL interface (interactive explorer) is also available at the same endpoint when accessed through a browser.

## Comparing REST and GraphQL APIs

### REST API (Original)
- Uses multiple endpoints for different resources
- Fixed data structure in responses
- Multiple requests needed for related data
- HTTP verbs (GET, POST, PUT, DELETE) determine operations

### GraphQL API (New)
- Single endpoint: `/graphql`
- Client specifies exactly what data to return
- Can retrieve multiple resources in a single request
- Operations determined by queries and mutations in the request body

## Examples

### Fetching Patients

#### REST API
```
GET /api/patients
```
Returns all patients with all their fields.

#### GraphQL API
```graphql
{
  allPatients {
    id
    firstName
    lastName
    email
  }
}
```
Returns only the specified fields for all patients.

### Fetching a Specific Patient with Related Data

#### REST API
Requires multiple requests:
```
GET /api/patients/{id}
GET /api/appointments?patientId={id}
GET /api/medications?patientId={id}
GET /api/medical-records?patientId={id}
```

#### GraphQL API
Single request:
```graphql
{
  patient(id: "patient_id_here") {
    id
    firstName
    lastName
    dateOfBirth
    gender
    email
    phone
    address
    allAppointments: allAppointments(patientId: "patient_id_here") {
      id
      appointmentDate
      startTime
      endTime
      status
      reason
    }
    allMedications: allMedications(patientId: "patient_id_here") {
      id
      name
      dosage
      frequency
      startDate
      endDate
    }
    allMedicalRecords: allMedicalRecords(patientId: "patient_id_here") {
      id
      visitDate
      chiefComplaint
      diagnosis
      treatmentPlan
    }
  }
}
```

### Creating a New Patient

#### REST API
```
POST /api/patients
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "address": "123 Main St",
  "insuranceId": "INS123",
  "medicalConditions": ["Hypertension"],
  "allergies": ["Penicillin"],
  "notes": "Patient notes"
}
```

#### GraphQL API
```graphql
mutation {
  createPatient(patientData: {
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    gender: "Male",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    address: "123 Main St",
    insuranceId: "INS123",
    medicalConditions: ["Hypertension"],
    allergies: ["Penicillin"],
    notes: "Patient notes"
  }) {
    patient {
      id
      firstName
      lastName
    }
  }
}
```

### Searching and Filtering Patients

#### REST API
```
GET /api/patients?search=Doe
```

#### GraphQL API
```graphql
{
  allPatients(search: "Doe") {
    id
    firstName
    lastName
    email
  }
}
```

### Pagination

#### REST API
```
GET /api/patients?page=1&perPage=10
```

#### GraphQL API
```graphql
{
  allPatients(limit: 10, offset: 0) {
    id
    firstName
    lastName
  }
}
```

## Benefits of Adding GraphQL

1. **Reduced Network Requests**: Get multiple related resources in a single request.
2. **No Over-fetching**: Only get the fields you actually need.
3. **Strong Typing**: Schema provides clear contract for what's available.
4. **Introspection**: API documentation is built-in through GraphiQL.
5. **Evolving API**: Add fields and types without breaking existing queries.

## Using the GraphiQL Interface

Navigate to `/graphql` in your browser to access the GraphiQL interface, which provides:
- Interactive query builder
- Auto-completion
- Documentation browser
- Query execution

## Next Steps

Consider enhancing the GraphQL API with:
1. Authentication integration
2. Subscriptions for real-time updates
3. More complex filtering and sorting options
4. Custom scalars for specific data types
5. Dataloaders for optimizing database queries
