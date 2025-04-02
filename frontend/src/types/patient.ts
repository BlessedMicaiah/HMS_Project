export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  insuranceId?: string;
  medicalConditions?: string[];
  allergies?: string[];
  notes?: string;
  profileImageUrl?: string;
  profileImage?: string; // Base64 encoded image data for upload
  createdBy?: string;
}

export interface MedicalImage {
  id: string;
  patientId: string;
  imageUrl: string;
  imageType: string;
  description?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
}

export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT';
