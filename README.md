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

## Architecture

This project follows the C4 Model architecture with:

- System Context: Healthcare system with patients, providers, and external interfaces
- Container: Microservices for different healthcare functions
- Component: Modular design within each service
