# Patient Service

This service is part of the Healthcare Management System, responsible for managing patient data. It's built with Python, Flask, and SQLAlchemy, providing RESTful APIs for CRUD operations on patient records.

## Features

- RESTful API endpoints for patient management
- PostgreSQL database for persistent storage
- Flask-SQLAlchemy ORM
- Data validation and error handling
- Docker and Docker Compose setup for easy deployment

## API Endpoints

| Endpoint                | Method | Description                   |
|-------------------------|--------|-------------------------------|
| `/api/patients`         | GET    | Get all patients              |
| `/api/patients/:id`     | GET    | Get a specific patient by ID  |
| `/api/patients`         | POST   | Create a new patient          |
| `/api/patients/:id`     | PUT    | Update an existing patient    |
| `/api/patients/:id`     | DELETE | Delete a patient              |
| `/health`               | GET    | Health check endpoint         |

## Installation and Setup

### Prerequisites
- Python 3.9+
- PostgreSQL
- Docker and Docker Compose (optional)

### Local Setup

1. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

2. **Configure the database**:
   - Create a PostgreSQL database named `patient_service`
   - Update the `.env` file with your database credentials if needed

3. **Initialize the database**:
   ```
   flask db init
   flask db migrate
   flask db upgrade
   ```

4. **Seed the database with sample data**:
   ```
   flask seed-db
   ```

5. **Run the application**:
   ```
   flask run --port=3001
   ```

### Docker Setup

Simply run:
```
docker-compose up
```

This will:
- Start a PostgreSQL container
- Build and start the Patient Service
- Initialize the database
- Run the application on port 3001

## Integration with API Gateway

The Patient Service is designed to work with the API Gateway. The API Gateway routes requests from clients to this service using the following path pattern:

```
/api/patients/* → Patient Service
```

Ensure that the API Gateway is configured to proxy requests to `http://localhost:3001` (or the appropriate URL if deployed differently).

## Development Notes

- The service uses SQLAlchemy ORM for database operations
- We're using Flask-Migrate for database migrations
- Error handling middleware is included for consistent error responses
- The service includes a health check endpoint for monitoring
