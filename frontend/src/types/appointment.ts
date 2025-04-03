export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
