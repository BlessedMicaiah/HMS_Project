import axios from 'axios';
import { Patient } from '../types/patient';
import { getCurrentUser, getToken } from './authService';

// Use the correct API URL for our backend server
const API_URL = 'http://localhost:3001/api/patients';

// Pagination response interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// In-memory cache of patients for development and fallback
let inMemoryPatients: Patient[] = [];

export const getPatients = async (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Patient>> => {
  try {
    // Use the actual API endpoint
    const response = await axios.get(`${API_URL}?page=${page}&per_page=${perPage}`);
    const paginatedResponse: PaginatedResponse<Patient> = response.data;
    
    // Make sure the data property exists and is an array
    if (!paginatedResponse.data) {
      paginatedResponse.data = [];
    }
    
    // Store the data in our in-memory cache
    inMemoryPatients = [...paginatedResponse.data];
    
    // Filter patients based on user role
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'ADMIN' && Array.isArray(paginatedResponse.data)) {
      // For non-admin users, only return patients they've created or are assigned to
      paginatedResponse.data = paginatedResponse.data.filter((patient: Patient) => 
        patient && patient.createdBy === currentUser.id
      );
    }
    
    return paginatedResponse;
  } catch (error) {
    console.error('Error fetching patients from API:', error);
    
    // Create a safe copy of the in-memory patients array
    let filteredPatients = [...inMemoryPatients];
    
    // Filter patients based on user role
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role !== 'ADMIN' && filteredPatients.length > 0) {
      // For non-admin users, only return patients they've created or are assigned to
      filteredPatients = filteredPatients.filter((patient: Patient) => 
        patient && patient.createdBy === currentUser.id
      );
    }
    
    // Create a fallback paginated response
    const paginatedResponse: PaginatedResponse<Patient> = {
      data: filteredPatients.slice((page - 1) * perPage, page * perPage),
      pagination: {
        total: filteredPatients.length,
        per_page: perPage,
        current_page: page,
        total_pages: Math.max(1, Math.ceil(filteredPatients.length / perPage)),
        has_next: page < Math.ceil(filteredPatients.length / perPage),
        has_prev: page > 1
      }
    };
    
    return paginatedResponse;
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
    const patient = inMemoryPatients.find((p: Patient) => p.id === id);
    if (!patient) {
      return Promise.reject(new Error('Patient not found'));
    }
    return patient;
  }
};

export const createPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  try {
    // Get the current user for authorization
    const user = getCurrentUser();
    const token = getToken();
    
    if (!user || !token) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    // Ensure all required fields are present
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'address'];
    for (const field of requiredFields) {
      if (!patientData[field as keyof typeof patientData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Create a copy of the data to avoid mutating the original
    const processedData = { ...patientData };
    
    // Ensure arrays are properly formatted
    if (processedData.medicalConditions && !Array.isArray(processedData.medicalConditions)) {
      if (typeof processedData.medicalConditions === 'string') {
        const conditionsStr = processedData.medicalConditions as string;
        processedData.medicalConditions = conditionsStr
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item !== '');
      } else {
        processedData.medicalConditions = [];
      }
    } else if (!processedData.medicalConditions) {
      processedData.medicalConditions = [];
    }
    
    if (processedData.allergies && !Array.isArray(processedData.allergies)) {
      if (typeof processedData.allergies === 'string') {
        const allergiesStr = processedData.allergies as string;
        processedData.allergies = allergiesStr
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item !== '');
      } else {
        processedData.allergies = [];
      }
    } else if (!processedData.allergies) {
      processedData.allergies = [];
    }
    
    console.log('Creating patient with data:', JSON.stringify(processedData));
    console.log('User token:', token);
    
    // Use the actual API endpoint with authorization header
    try {
      const response = await axios.post(API_URL, processedData, {
        headers: {
          'X-User-ID': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response:', response.data);
      const newPatient = response.data;
      
      // Update our in-memory cache
      inMemoryPatients.push(newPatient);
      return newPatient;
    } catch (apiError: any) {
      console.error('API error when creating patient:', apiError);
      
      // For development mode, use mock implementation as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock patient creation');
        const newPatient: Patient = {
          ...processedData,
          id: Date.now().toString() // Generate a unique ID
        };
        
        // Add to our in-memory cache
        inMemoryPatients.push(newPatient);
        return newPatient;
      }
      
      throw apiError; // Re-throw the error for production environments
    }
  } catch (error: any) {
    console.error('Error creating patient:', error);
    
    // For development mode, use mock implementation as fallback
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock patient creation');
      const newPatient: Patient = {
        ...patientData,
        id: Date.now().toString() // Generate a unique ID
      };
      
      // Add to our in-memory cache
      inMemoryPatients.push(newPatient);
      return newPatient;
    }
    
    throw error; // Re-throw the error for production environments
  }
};

export const updatePatient = async (id: string, patientData: Partial<Patient>): Promise<Patient> => {
  try {
    // Get the current user for authorization
    const user = getCurrentUser();
    const token = getToken();
    
    if (!user || !token) {
      throw new Error('User not authenticated');
    }
    
    // Create a copy of the data to avoid mutating the original
    const processedData = { ...patientData };
    
    // Ensure arrays are properly formatted
    if (processedData.medicalConditions && !Array.isArray(processedData.medicalConditions)) {
      if (typeof processedData.medicalConditions === 'string') {
        const conditionsStr = processedData.medicalConditions as string;
        processedData.medicalConditions = conditionsStr
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item !== '');
      } else {
        processedData.medicalConditions = [];
      }
    }
    
    if (processedData.allergies && !Array.isArray(processedData.allergies)) {
      if (typeof processedData.allergies === 'string') {
        const allergiesStr = processedData.allergies as string;
        processedData.allergies = allergiesStr
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item !== '');
      } else {
        processedData.allergies = [];
      }
    }
    
    console.log('Updating patient with data:', JSON.stringify(processedData));
    
    // Use the actual API endpoint with authorization header
    try {
      const response = await axios.put(`${API_URL}/${id}`, processedData, {
        headers: {
          'X-User-ID': token,
          'Content-Type': 'application/json'
        }
      });
      
      const updatedPatient = response.data;
      
      // Update our in-memory cache
      const index = inMemoryPatients.findIndex((p: Patient) => p.id === id);
      if (index !== -1) {
        inMemoryPatients[index] = updatedPatient;
      }
      
      return updatedPatient;
    } catch (apiError) {
      console.error('API error when updating patient:', apiError);
      
      // For development mode, use mock implementation as fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock patient update');
        const index = inMemoryPatients.findIndex((p: Patient) => p.id === id);
        if (index !== -1) {
          const updatedPatient = {
            ...inMemoryPatients[index],
            ...processedData
          };
          inMemoryPatients[index] = updatedPatient;
          return updatedPatient;
        }
        throw new Error('Patient not found');
      }
      
      throw apiError; // Re-throw the error for production environments
    }
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    console.log(`Starting deletion process for patient ID: ${id}`);
    
    // Get the current user for authorization
    const user = getCurrentUser();
    const token = getToken();
    
    if (!user || !token) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log(`Attempting to delete patient with ID: ${id}`);
    console.log('User token:', token);
    console.log('User permissions:', user.permissions);
    
    // For development mode, use mock implementation first
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Using mock patient deletion');
      const index = inMemoryPatients.findIndex((p: Patient) => p.id === id);
      if (index !== -1) {
        inMemoryPatients.splice(index, 1);
        console.log(`Removed patient ${id} from in-memory cache`);
        return;
      } else {
        console.log(`Patient ${id} not found in in-memory cache`);
      }
    }
    
    // Then try the API call (this will only run in production or if the mock implementation fails)
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: {
          'X-User-ID': token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`API response for delete:`, response.data);
      console.log(`Successfully deleted patient with ID: ${id}`);
      
      // Update our in-memory cache
      const index = inMemoryPatients.findIndex((p: Patient) => p.id === id);
      if (index !== -1) {
        inMemoryPatients.splice(index, 1);
        console.log(`Removed patient ${id} from in-memory cache`);
      }
    } catch (apiError: any) {
      console.error(`API error when deleting patient ${id}:`, apiError);
      console.error('API error response:', apiError.response?.data);
      console.error('API error status:', apiError.response?.status);
      
      throw apiError; // Re-throw the error
    }
  } catch (error: any) {
    console.error(`Error deleting patient ${id}:`, error);
    throw error; // Re-throw the error
  }
};
