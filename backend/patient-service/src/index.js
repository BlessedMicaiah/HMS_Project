const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

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

// API Routes
// Get all patients
app.get('/api/patients', (req, res) => {
  res.json(patients);
});

// Get patient by ID
app.get('/api/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  res.json(patient);
});

// Create new patient
app.post('/api/patients', (req, res) => {
  const newPatient = {
    id: uuidv4(),
    ...req.body
  };
  patients.push(newPatient);
  res.status(201).json(newPatient);
});

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

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const index = patients.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  patients.splice(index, 1);
  res.status(204).end();
});

// Start server
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
