import axios from 'axios';
import { Appointment } from '../types/appointment';
import { getCurrentUser } from './authService';
import { PaginatedResponse } from './patientService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// In-memory store for appointments
let inMemoryAppointments: Appointment[] = [];

// Sample mock data for when API is unavailable
const mockAppointments: Appointment[] = [
  {
    id: 'mock-appointment-1',
    patientId: 'mock-patient-1',
    doctorId: '2', // Match this with common test user IDs
    appointmentDate: '2025-04-02',
    startTime: '09:00',
    endTime: '09:30',
    status: 'SCHEDULED',
    reason: 'Annual check-up',
    notes: 'Patient has concerns about blood pressure',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-15T10:00:00Z'
  },
  {
    id: 'mock-appointment-2',
    patientId: 'mock-patient-2',
    doctorId: '2', // Match this with common test user IDs
    appointmentDate: '2025-04-02',
    startTime: '10:30',
    endTime: '11:00',
    status: 'SCHEDULED',
    reason: 'Follow-up appointment',
    notes: 'Review lab results',
    createdAt: '2025-03-20T14:30:00Z',
    updatedAt: '2025-03-20T14:30:00Z'
  }
];

export const getAppointments = async (page: number = 1, perPage: number = 10, date?: string): Promise<PaginatedResponse<Appointment>> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Build the query string
    let queryParams = `page=${page}&per_page=${perPage}`;
    if (date) {
      queryParams += `&date=${date}`;
    }
    
    const response = await axios.get(`${API_URL}/api/appointments?${queryParams}`, { headers });
    const paginatedResponse: PaginatedResponse<Appointment> = response.data;
    
    // Store in memory for offline use
    inMemoryAppointments = paginatedResponse.data;
    
    // Filter appointments based on user role
    if (currentUser && currentUser.role !== 'ADMIN') {
      // For non-admin users, only return appointments they are assigned to as doctor
      paginatedResponse.data = paginatedResponse.data.filter(appointment => appointment.doctorId === currentUser.id);
    }
    
    return paginatedResponse;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    
    // Use mock data if the API is unavailable
    if (inMemoryAppointments.length === 0) {
      inMemoryAppointments = mockAppointments;
    }
    
    // Filter appointments based on user role for mock data too
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'ADMIN') {
      inMemoryAppointments = inMemoryAppointments.filter(appointment => appointment.doctorId === currentUser.id);
    }
    
    // Create a paginated response from our mock data
    const filteredAppointments = date 
      ? inMemoryAppointments.filter(a => a.appointmentDate === date)
      : inMemoryAppointments;
      
    const paginatedResponse: PaginatedResponse<Appointment> = {
      data: filteredAppointments.slice((page - 1) * perPage, page * perPage),
      pagination: {
        total: filteredAppointments.length,
        per_page: perPage,
        current_page: page,
        total_pages: Math.ceil(filteredAppointments.length / perPage) || 1,
        has_next: page < Math.ceil(filteredAppointments.length / perPage),
        has_prev: page > 1
      }
    };
    
    return paginatedResponse;
  }
};

export const getAppointment = async (id: string): Promise<Appointment> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.get(`${API_URL}/api/appointments/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error);
    
    // Fallback to mock data
    const appointment = inMemoryAppointments.find(a => a.id === id);
    if (!appointment) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    return appointment;
  }
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    // Set the doctorId to the current user's ID if they are a doctor
    if (currentUser && currentUser.role === 'DOCTOR' && !appointmentData.doctorId) {
      appointmentData = {
        ...appointmentData,
        doctorId: currentUser.id
      };
    }
    
    const response = await axios.post(`${API_URL}/api/appointments`, appointmentData, { headers });
    
    // Update in-memory cache
    const newAppointment = response.data;
    inMemoryAppointments.push(newAppointment);
    
    return newAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    // Fallback to creating a mock appointment
    const newAppointment: Appointment = {
      id: String(Date.now()),
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    inMemoryAppointments.push(newAppointment);
    return newAppointment;
  }
};

export const updateAppointment = async (id: string, appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    const response = await axios.put(`${API_URL}/api/appointments/${id}`, appointmentData, { headers });
    
    // Update in-memory cache
    const updatedAppointment = response.data;
    const index = inMemoryAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      inMemoryAppointments[index] = updatedAppointment;
    }
    
    return updatedAppointment;
  } catch (error) {
    console.error(`Error updating appointment ${id}:`, error);
    
    // Fallback to updating the mock appointment
    const index = inMemoryAppointments.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Appointment with id ${id} not found`);
    }
    
    const updatedAppointment: Appointment = {
      ...inMemoryAppointments[index],
      ...appointmentData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    inMemoryAppointments[index] = updatedAppointment;
    return updatedAppointment;
  }
};

export const deleteAppointment = async (id: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    const headers = currentUser ? { 'X-User-ID': currentUser.id } : {};
    
    await axios.delete(`${API_URL}/api/appointments/${id}`, { headers });
    
    // Update in-memory cache
    inMemoryAppointments = inMemoryAppointments.filter(a => a.id !== id);
  } catch (error) {
    console.error(`Error deleting appointment ${id}:`, error);
    
    // Fallback to deleting from the mock data
    inMemoryAppointments = inMemoryAppointments.filter(a => a.id !== id);
  }
};
