import axios from 'axios';
import { MedicalRecord } from '../types/medicalRecord';
import { getCurrentUser } from './authService';
import { PaginatedResponse } from './patientService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// In-memory store for medical records
let inMemoryRecords: MedicalRecord[] = [];

// Sample mock data for offline use
const mockRecords: MedicalRecord[] = [
  {
    id: 'mock-record-1',
    patientId: 'mock-patient-1',
    doctorId: '2',
    visitDate: '2025-03-15',
    chiefComplaint: 'Headache and dizziness',
    diagnosis: 'Migraine',
    treatmentPlan: 'Prescribed Sumatriptan and rest for 2 days',
    followUpNeeded: true,
    notes: 'Patient reports symptoms worsening over the past week',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z'
  },
  {
    id: 'mock-record-2',
    patientId: 'mock-patient-2',
    doctorId: '2',
    visitDate: '2025-03-20',
    chiefComplaint: 'Sore throat and fever',
    diagnosis: 'Strep throat',
    treatmentPlan: 'Prescribed antibiotics for 10 days',
    followUpNeeded: false,
    notes: 'Patient allergic to penicillin, using alternative antibiotic',
    createdAt: '2025-03-20T14:30:00Z',
    updatedAt: '2025-03-20T14:30:00Z'
  }
];

export const getMedicalRecords = async (page: number = 1, perPage: number = 10, patientId?: string): Promise<PaginatedResponse<MedicalRecord>> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Build the query string
    let queryParams = `page=${page}&per_page=${perPage}`;
    if (patientId) {
      queryParams += `&patient_id=${patientId}`;
    }
    
    const response = await axios.get(`${API_URL}/api/medical-records?${queryParams}`, { headers });
    const paginatedResponse: PaginatedResponse<MedicalRecord> = response.data;
    
    // Store in memory for offline use
    inMemoryRecords = paginatedResponse.data;
    
    // Filter records based on user role
    if (currentUser && currentUser.role !== 'ADMIN') {
      // For non-admin users, only return records they created
      paginatedResponse.data = paginatedResponse.data.filter(record => record.doctorId === currentUser.id);
    }
    
    return paginatedResponse;
  } catch (error) {
    console.error('Error fetching medical records:', error);
    // Instead of using inMemoryRecords or mockRecords, always return an empty array on error
    return {
      data: [],
      pagination: {
        total: 0,
        per_page: perPage,
        current_page: page,
        total_pages: 1,
        has_next: false,
        has_prev: false
      }
    };
  }
};

export const getMedicalRecord = async (id: string): Promise<MedicalRecord> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.get(`${API_URL}/api/medical-records/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching medical record ${id}:`, error);
    
    // Fallback to mock data
    const record = inMemoryRecords.find(r => r.id === id);
    if (!record) {
      throw new Error(`Medical record with id ${id} not found`);
    }
    return record;
  }
};

export const createMedicalRecord = async (recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Set the doctorId to the current user's ID if they are a doctor
    if (currentUser && currentUser.role === 'DOCTOR' && !recordData.doctorId) {
      recordData = {
        ...recordData,
        doctorId: currentUser.id
      };
    }
    
    const response = await axios.post(`${API_URL}/api/medical-records`, recordData, { headers });
    
    // Update in-memory cache
    const newRecord = response.data;
    inMemoryRecords.push(newRecord);
    
    return newRecord;
  } catch (error) {
    console.error('Error creating medical record:', error);
    
    // Fallback to creating a mock record
    const newRecord: MedicalRecord = {
      id: String(Date.now()),
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    inMemoryRecords.push(newRecord);
    return newRecord;
  }
};

export const updateMedicalRecord = async (id: string, recordData: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicalRecord> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.put(`${API_URL}/api/medical-records/${id}`, recordData, { headers });
    
    // Update in-memory cache
    const updatedRecord = response.data;
    const index = inMemoryRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      inMemoryRecords[index] = updatedRecord;
    }
    
    return updatedRecord;
  } catch (error) {
    console.error(`Error updating medical record ${id}:`, error);
    
    // Fallback to updating the mock record
    const index = inMemoryRecords.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Medical record with id ${id} not found`);
    }
    
    const updatedRecord: MedicalRecord = {
      ...inMemoryRecords[index],
      ...recordData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    inMemoryRecords[index] = updatedRecord;
    return updatedRecord;
  }
};

export const deleteMedicalRecord = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    await axios.delete(`${API_URL}/api/medical-records/${id}`, { headers });
    
    // Update in-memory cache
    inMemoryRecords = inMemoryRecords.filter(r => r.id !== id);
  } catch (error) {
    console.error(`Error deleting medical record ${id}:`, error);
    
    // Fallback to deleting from the mock data
    inMemoryRecords = inMemoryRecords.filter(r => r.id !== id);
  }
};
