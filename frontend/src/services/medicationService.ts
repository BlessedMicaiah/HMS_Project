import axios from 'axios';
import { Medication } from '../types/medication';
import { getCurrentUser } from './authService';
import { PaginatedResponse } from './patientService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// In-memory store for medications
let inMemoryMedications: Medication[] = [];

// Sample mock data for offline use
const mockMedications: Medication[] = [
  {
    id: 'mock-medication-1',
    patientId: 'mock-patient-1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    startDate: '2025-03-01',
    endDate: '2025-06-01',
    prescribedBy: '2',
    notes: 'Take with food in the morning',
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z'
  },
  {
    id: 'mock-medication-2',
    patientId: 'mock-patient-2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    startDate: '2025-02-15',
    endDate: '2025-05-15',
    prescribedBy: '2',
    notes: 'Take with meals',
    createdAt: '2025-02-15T14:30:00Z',
    updatedAt: '2025-02-15T14:30:00Z'
  }
];

export const getMedications = async (page: number = 1, perPage: number = 10, patientId?: string): Promise<PaginatedResponse<Medication>> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Build the query string
    let queryParams = `page=${page}&per_page=${perPage}`;
    if (patientId) {
      queryParams += `&patient_id=${patientId}`;
    }
    
    const response = await axios.get(`${API_URL}/api/medications?${queryParams}`, { headers });
    const paginatedResponse: PaginatedResponse<Medication> = response.data;
    
    // Store in memory for offline use
    inMemoryMedications = paginatedResponse.data;
    
    // Filter medications based on user role
    if (currentUser && currentUser.role !== 'ADMIN') {
      // For non-admin users, only return medications they prescribed
      paginatedResponse.data = paginatedResponse.data.filter(medication => medication.prescribedBy === currentUser.id);
    }
    
    return paginatedResponse;
  } catch (error) {
    console.error('Error fetching medications:', error);
    
    // Use mock data if the API is unavailable
    if (inMemoryMedications.length === 0) {
      inMemoryMedications = mockMedications;
    }
    
    // Filter medications based on user role for mock data too
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'ADMIN') {
      inMemoryMedications = inMemoryMedications.filter(medication => medication.prescribedBy === currentUser.id);
    }
    
    // Filter by patient ID if provided
    const filteredMedications = patientId 
      ? inMemoryMedications.filter(m => m.patientId === patientId)
      : inMemoryMedications;
      
    // Create a paginated response from our mock data
    const paginatedResponse: PaginatedResponse<Medication> = {
      data: filteredMedications.slice((page - 1) * perPage, page * perPage),
      pagination: {
        total: filteredMedications.length,
        per_page: perPage,
        current_page: page,
        total_pages: Math.ceil(filteredMedications.length / perPage) || 1,
        has_next: page < Math.ceil(filteredMedications.length / perPage),
        has_prev: page > 1
      }
    };
    
    return paginatedResponse;
  }
};

export const getMedication = async (id: string): Promise<Medication> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.get(`${API_URL}/api/medications/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching medication ${id}:`, error);
    
    // Fallback to mock data
    const medication = inMemoryMedications.find(m => m.id === id);
    if (!medication) {
      throw new Error(`Medication with id ${id} not found`);
    }
    return medication;
  }
};

export const createMedication = async (medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Set the prescribedBy to the current user's ID if they are a doctor
    if (currentUser && currentUser.role === 'DOCTOR' && !medicationData.prescribedBy) {
      medicationData = {
        ...medicationData,
        prescribedBy: currentUser.id
      };
    }
    
    const response = await axios.post(`${API_URL}/api/medications`, medicationData, { headers });
    
    // Update in-memory cache
    const newMedication = response.data;
    inMemoryMedications.push(newMedication);
    
    return newMedication;
  } catch (error) {
    console.error('Error creating medication:', error);
    
    // Fallback to creating a mock medication
    const newMedication: Medication = {
      id: String(Date.now()),
      ...medicationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    inMemoryMedications.push(newMedication);
    return newMedication;
  }
};

export const updateMedication = async (id: string, medicationData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>): Promise<Medication> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.put(`${API_URL}/api/medications/${id}`, medicationData, { headers });
    
    // Update in-memory cache
    const updatedMedication = response.data;
    const index = inMemoryMedications.findIndex(m => m.id === id);
    if (index !== -1) {
      inMemoryMedications[index] = updatedMedication;
    }
    
    return updatedMedication;
  } catch (error) {
    console.error(`Error updating medication ${id}:`, error);
    
    // Fallback to updating the mock medication
    const index = inMemoryMedications.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error(`Medication with id ${id} not found`);
    }
    
    const updatedMedication: Medication = {
      ...inMemoryMedications[index],
      ...medicationData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    inMemoryMedications[index] = updatedMedication;
    return updatedMedication;
  }
};

export const deleteMedication = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    await axios.delete(`${API_URL}/api/medications/${id}`, { headers });
    
    // Update in-memory cache
    inMemoryMedications = inMemoryMedications.filter(m => m.id !== id);
  } catch (error) {
    console.error(`Error deleting medication ${id}:`, error);
    
    // Fallback to deleting from the mock data
    inMemoryMedications = inMemoryMedications.filter(m => m.id !== id);
  }
};
