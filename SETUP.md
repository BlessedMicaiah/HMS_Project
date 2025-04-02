# Healthcare Management System - Setup Guide

## Project Structure

This Healthcare Management System follows the C4 Model architecture described in the architectural document:

- **Frontend**: React-based web application for patient management
- **Backend**:
  - **API Gateway**: Routes requests to appropriate microservices
  - **Patient Service**: Manages patient data and operations

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Backend Setup

1. **Start the Patient Service**:
   ```bash
   cd backend/patient-service
   npm install
   npm start
   ```
   The Patient Service will run on http://localhost:3001

2. **Start the API Gateway**:
   ```bash
   cd backend/api-gateway
   npm install
   npm start
   ```
   The API Gateway will run on http://localhost:3000

### Frontend Setup

1. **Install dependencies and start the React application**:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The React application will run on http://localhost:3000

## Using the Application

1. Open your browser and navigate to http://localhost:3000
2. Use the navigation menu to view or add patients
3. You can view, edit, or delete patient records using the provided interfaces

## Current Features (MVP)

- **Patient Management**:
  - View list of patients
  - Add new patients
  - View detailed patient information
  - Edit patient details
  - Delete patients

## Technical Details

- **Frontend**: React with TypeScript, Bootstrap for UI components
- **Backend**: Node.js with Express
- **Communication**: REST API through the API Gateway
- **Data Storage**: In-memory storage for MVP (can be replaced with a database in future iterations)

## Troubleshooting

- If you encounter port conflicts, you can modify the port numbers in:
  - Frontend: package.json (add "PORT=3006" to the start script)
  - API Gateway: src/index.js (modify the PORT constant)
  - Patient Service: src/index.js (modify the PORT constant)

- If you're unable to access the API, ensure both backend services are running and the API Gateway is correctly configured to proxy requests to the Patient Service.
