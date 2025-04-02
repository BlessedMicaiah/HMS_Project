import axios from 'axios';
import { Patient } from '../types/patient';

// Use the correct API URL for our backend server
const API_URL = 'http://localhost:3001/api/demo/patients';

// We'll keep the mock data for fallback, but primarily use the API
const mockPatients: Patient[] = [
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

// In-memory store for patients (for disconnected operation)
let inMemoryPatients = [...mockPatients];

export const getPatients = async (): Promise<Patient[]> => {
  try {
    // Use the actual API endpoint
    const response = await axios.get(API_URL);
    // Store the data in our in-memory cache
    inMemoryPatients = response.data;
    return response.data;
  } catch (error) {
    console.error('Error fetching patients from API:', error);
    // Fall back to in-memory data
    return inMemoryPatients;
  }
};

export const getPatient = async (id: string): Promise<Patient> => {
  try {
    // Use the actual API endpoint
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching patient ${id} from API:`, error);
    // Fall back to in-memory data
    const patient = inMemoryPatients.find(p => p.id === id);
    if (!patient) {
      return Promise.reject(new Error('Patient not found'));
    }
    return patient;
  }
};

export const createPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  try {
    // Use the actual API endpoint
    const response = await axios.post(API_URL, patientData);
    const newPatient = response.data;
    
    // Update our in-memory cache
    inMemoryPatients.push(newPatient);
    return newPatient;
  } catch (error) {
    console.error('Error creating patient via API:', error);
    // Mock implementation as fallback
    const newPatient: Patient = {
      ...patientData,
      id: Date.now().toString() // Generate a unique ID
    };
    
    // Add to our in-memory cache
    inMemoryPatients.push(newPatient);
    return newPatient;
  }
};

export const updatePatient = async (id: string, patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  try {
    // Use the actual API endpoint
    const response = await axios.put(`${API_URL}/${id}`, patientData);
    const updatedPatient = response.data;
    
    // Update our in-memory cache
    const index = inMemoryPatients.findIndex(p => p.id === id);
    if (index !== -1) {
      inMemoryPatients[index] = updatedPatient;
    }
    
    return updatedPatient;
  } catch (error) {
    console.error(`Error updating patient ${id} via API:`, error);
    // Mock implementation as fallback
    const updatedPatient: Patient = {
      ...patientData,
      id
    };
    
    // Update our in-memory cache
    const index = inMemoryPatients.findIndex(p => p.id === id);
    if (index !== -1) {
      inMemoryPatients[index] = updatedPatient;
    } else {
      inMemoryPatients.push(updatedPatient);
    }
    
    return updatedPatient;
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    // Use the actual API endpoint
    await axios.delete(`${API_URL}/${id}`);
    
    // Update our in-memory cache
    inMemoryPatients = inMemoryPatients.filter(p => p.id !== id);
  } catch (error) {
    console.error(`Error deleting patient ${id} via API:`, error);
    // Update our in-memory cache
    inMemoryPatients = inMemoryPatients.filter(p => p.id !== id);
  }
  return Promise.resolve();
};
