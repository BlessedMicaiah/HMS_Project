export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  followUpNeeded: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
