const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare Management System API',
      description: 'Patient Service API Documentation',
      version: '1.0.0',
      contact: {
        name: 'HMS Team'
      },
      servers: [{
        url: 'http://localhost:3001'
      }]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/index.js']
};

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Mock database for patients
let patients = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-05-15',
    gender: 'Male',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, USA',
    insuranceId: 'INS-12345',
    medicalConditions: ['Hypertension', 'Asthma'],
    allergies: ['Penicillin'],
    notes: 'Patient prefers morning appointments'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1975-08-21',
    gender: 'Female',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, Somewhere, USA',
    insuranceId: 'INS-67890',
    medicalConditions: ['Diabetes Type 2'],
    allergies: ['Sulfa', 'Shellfish'],
    notes: 'Regular checkup needed every 3 months'
  }
];

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Returns all patients
 *     description: Retrieves a list of all patients in the system
 *     responses:
 *       200:
 *         description: A list of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                   gender:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   insuranceId:
 *                     type: string
 *                   medicalConditions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   allergies:
 *                     type: array
 *                     items:
 *                       type: string
 *                   notes:
 *                     type: string
 */
// API Routes
// Get all patients
app.get('/api/patients', (req, res) => {
  res.json(patients);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get a patient by ID
 *     description: Retrieves a specific patient by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the patient to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A patient object
 *       404:
 *         description: Patient not found
 */
// Get patient by ID
app.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  res.json(patient);
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient
 *     description: Adds a new patient to the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               gender:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               insuranceId:
 *                 type: string
 *               medicalConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully created patient
 */
// Create new patient
app.post('/api/patients', (req, res) => {
  const newPatient = {
    id: uuidv4(),
    ...req.body
  };
  patients.push(newPatient);
  res.status(201).json(newPatient);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update a patient
 *     description: Updates an existing patient's information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the patient to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *               gender:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               insuranceId:
 *                 type: string
 *               medicalConditions:
 *                 type: array
 *                 items:
 *                   type: string
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully updated patient
 *       404:
 *         description: Patient not found
 */
// Update patient
app.put('/api/patients/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  const updatedPatient = {
    ...req.body,
    id: req.params.id
  };
  
  patients[index] = updatedPatient;
  res.json(updatedPatient);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete a patient
 *     description: Removes a patient from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the patient to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully deleted patient
 *       404:
 *         description: Patient not found
 */
// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  patients.splice(index, 1);
  res.status(204).end();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the service
 *     responses:
 *       200:
 *         description: Service is healthy
 */
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

/**
 * @swagger
 * /api/public/test:
 *   get:
 *     summary: Public test endpoint
 *     description: A public endpoint for testing API connectivity
 *     responses:
 *       200:
 *         description: Test successful
 */
// Public test endpoint
app.get('/api/public/test', (req, res) => {
  res.status(200).json({ message: 'Public API is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
});
