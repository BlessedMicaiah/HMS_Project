# Backend and Database Architecture

## 1. Backend Architecture Overview

The HMS backend follows a microservices architecture with two main components:

- **API Gateway**: A Node.js/Express service that acts as the entry point for all client requests
- **Patient Service**: A Python/Flask service that implements the core healthcare domain logic

This architecture provides:
- **Service isolation**: Each component can be developed, deployed, and scaled independently
- **Technology flexibility**: Each service uses the most appropriate tech stack for its purpose
- **Resilience**: Failures in one service do not necessarily affect others
- **Scalability**: Services can be scaled based on their specific load requirements

## 2. API Gateway Implementation

The API Gateway (implemented in `backend/api-gateway/src/index.js`) serves as:

- **Single entry point** for all client requests
- **Request router** to appropriate backend services
- **Cross-cutting concerns handler** for:
  - Rate limiting (prevents API abuse)
  - Request/response logging
  - Error handling
  - Service health monitoring

```javascript
// Example routing configuration
app.use('/api/patients', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/patients': '/api/patients'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The patient service is currently unavailable.'
    });
  }
}));
```

## 3. Patient Service Implementation

The Patient Service (implemented in `backend/patient-service/app.py`) provides:

- **RESTful API endpoints** for healthcare data operations
- **GraphQL support** for complex data queries
- **Business logic** for healthcare domain operations
- **Data validation** and processing
- **Authentication and authorization** mechanisms

The service is structured as:

- **Flask application** with RESTful route definitions
- **SQLAlchemy ORM** for database interactions
- **Middleware** for cross-cutting concerns
- **Domain models** representing healthcare entities

```python
# Example API endpoint implementation
@app.route('/api/patients', methods=['GET'])
@authorize('read')
def get_all_patients():
    # Pagination parameters
    page = int(request.args.get('page', 1))
    per_page = min(int(request.args.get('per_page', 10)), 100)
    
    # Query database with pagination
    patients = Patient.query.paginate(page=page, per_page=per_page)
    
    # Format response
    return jsonify({
        'data': [patient.to_dict() for patient in patients.items],
        'pagination': {
            'total': patients.total,
            'per_page': patients.per_page,
            'current_page': patients.page,
            'total_pages': patients.pages,
            'has_next': patients.has_next,
            'has_prev': patients.has_prev
        }
    })
```

## 4. Database Schema and Design

The database uses SQLAlchemy ORM with SQLite (in development) and is designed to support:

- **Core healthcare entities**:
  - Users (healthcare providers)
  - Patients
  - Medical Images
  - Appointments
  - Medications
  - Medical Records

The schema is implemented with:

- **UUID primary keys** for global uniqueness
- **Foreign key relationships** for data integrity
- **Audit fields** (creation/modification timestamps)
- **Custom data types** for complex JSON data storage

```python
# Example model implementation
class Patient(db.Model):
    __tablename__ = 'patients'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    firstName = db.Column(db.String(50), nullable=False)
    lastName = db.Column(db.String(50), nullable=False)
    dateOfBirth = db.Column(db.String(10), nullable=False)
    gender = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    # Additional fields...
    
    # Relationships
    appointments = db.relationship('Appointment', backref='patient', lazy=True)
    medical_records = db.relationship('MedicalRecord', backref='patient', lazy=True)
    medications = db.relationship('Medication', backref='patient', lazy=True)
```

## 5. Data Flow Processes

When a client makes a request, the data flows through the system as follows:

1. **Frontend** sends HTTP request to the API Gateway
2. **API Gateway** routes the request to the appropriate service
3. **Patient Service** processes the request:
   - Validates authentication token
   - Checks authorization for the requested operation
   - Processes and validates input data
   - Performs database operations via ORM
   - Formats the response data
4. **Response** flows back through the API Gateway to the client

## 6. Authentication and Authorization

The system implements a multi-layered security approach:

- **JWT-based authentication**: Tokens issued upon successful login
- **Role-based access control**: Users assigned roles with specific permissions
- **Middleware authorization**: Each endpoint protected by permission checks
- **Data-level security**: Users can only access data they're authorized to see

```python
# Example authorization decorator
def authorize(required_permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Extract and validate token
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({
                    'error': 'Unauthorized',
                    'message': 'Authentication required'
                }), 401
            
            # Check user permissions
            user = User.query.get(user_id)
            if not user or not user.has_permission(required_permission):
                return jsonify({
                    'error': 'Forbidden',
                    'message': 'Insufficient permissions'
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```

## 7. Error Handling Strategy

The backend implements comprehensive error handling:

- **HTTP status codes**: Appropriate codes for different error conditions
- **Structured error responses**: JSON format with error type and description
- **Input validation**: Form data and query parameter validation
- **Database error handling**: Transaction management and exception handling
- **Service unavailability handling**: Graceful degradation when services fail

## 8. Performance Optimization Features

The database and backend are optimized with:

- **Pagination**: Limiting result sets for large collections
- **Query optimization**: Efficient SQL queries and indexes
- **Connection pooling**: Database connection reuse
- **Prepared statements**: Protection against SQL injection
- **Data type handling**: Efficient storage of complex data

This backend architecture provides a solid foundation for the Healthcare Management System, balancing flexibility, security, and performance while enabling future scalability and feature expansion.
