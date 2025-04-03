import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatients, PaginatedResponse } from '../services/patientService';
import { getAppointments } from '../services/appointmentService';
import { getMedications } from '../services/medicationService';
import { getMedicalRecords } from '../services/medicalRecordService';
import { Patient } from '../types/patient';
import { Appointment } from '../types/appointment';
import { Medication } from '../types/medication';
import { MedicalRecord } from '../types/medicalRecord';

const Dashboard: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  
  // State for different data types
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  
  // Pagination states
  const [patientsTotal, setPatientsTotal] = useState<number>(0);
  const [appointmentsTotal, setAppointmentsTotal] = useState<number>(0);
  const [medicationsTotal, setMedicationsTotal] = useState<number>(0);
  const [medicalRecordsTotal, setMedicalRecordsTotal] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all required data with pagination (just first page for dashboard)
        const patientResponse = await getPatients(1, 5);
        const appointmentResponse = await getAppointments(1, 5);
        const medicationResponse = await getMedications(1, 5);
        const medicalRecordResponse = await getMedicalRecords(1, 5);
        
        // Extract data arrays and totals from paginated responses
        setPatients(patientResponse.data);
        setPatientsTotal(patientResponse.pagination.total);
        
        setAppointments(appointmentResponse.data);
        setAppointmentsTotal(appointmentResponse.pagination.total);
        
        setMedications(medicationResponse.data);
        setMedicationsTotal(medicationResponse.pagination.total);
        
        setMedicalRecords(medicalRecordResponse.data);
        setMedicalRecordsTotal(medicalRecordResponse.pagination.total);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Quick action buttons
  const QuickActions = () => (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Quick Actions</h5>
      </Card.Header>
      <Card.Body>
        <Row className="text-center">
          <Col xs={6} md={3} className="mb-3">
            <Button 
              variant="outline-primary" 
              className="w-100 py-3"
              onClick={() => navigate('/patients/new')}
            >
              <i className="bi bi-person-plus mb-2 fs-4 d-block"></i>
              <div>New Patient</div>
            </Button>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <Button 
              variant="outline-success" 
              className="w-100 py-3"
              onClick={() => navigate('/appointments/new')}
            >
              <i className="bi bi-calendar-plus mb-2 fs-4 d-block"></i>
              <div>New Appointment</div>
            </Button>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <Button 
              variant="outline-info" 
              className="w-100 py-3"
              onClick={() => navigate('/medications/new')}
            >
              <i className="bi bi-capsule mb-2 fs-4 d-block"></i>
              <div>New Medication</div>
            </Button>
          </Col>
          <Col xs={6} md={3} className="mb-3">
            <Button 
              variant="outline-warning" 
              className="w-100 py-3"
              onClick={() => navigate('/medical-records/new')}
            >
              <i className="bi bi-file-earmark-medical mb-2 fs-4 d-block"></i>
              <div>New Record</div>
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Today's appointments
  const TodaysAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(
      appointment => appointment.appointmentDate === today
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Today's Appointments</h5>
          <Link to="/appointments" className="btn btn-sm btn-light">View All</Link>
        </Card.Header>
        <Card.Body>
          {todaysAppointments.length === 0 ? (
            <p className="text-muted text-center">No appointments scheduled for today.</p>
          ) : (
            <ListGroup variant="flush">
              {todaysAppointments.slice(0, 5).map(appointment => {
                const patient = patients.find(p => p.id === appointment.patientId);
                return (
                  <ListGroup.Item key={appointment.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                      <div>
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
                      </div>
                    </div>
                    <div>
                      <Badge bg={
                        appointment.status === 'SCHEDULED' ? 'primary' :
                        appointment.status === 'CONFIRMED' ? 'success' :
                        appointment.status === 'CANCELLED' ? 'danger' :
                        appointment.status === 'COMPLETED' ? 'info' : 'secondary'
                      }>
                        {appointment.status}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Recent patients
  const RecentPatients = () => {
    // Sort patients alphabetically by last name and first name instead of creation date
    const sortedPatients = [...patients].sort((a, b) => {
      // First sort by last name
      const lastNameComparison = a.lastName.localeCompare(b.lastName);
      
      // If last names are the same, sort by first name
      if (lastNameComparison === 0) {
        return a.firstName.localeCompare(b.firstName);
      }
      
      return lastNameComparison;
    });
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">My Patients</h5>
          <Link to="/patients" className="btn btn-sm btn-light">View All ({patientsTotal})</Link>
        </Card.Header>
        <Card.Body>
          {sortedPatients.length === 0 ? (
            <p className="text-muted text-center">No patients found.</p>
          ) : (
            <ListGroup variant="flush">
              {sortedPatients.slice(0, 5).map(patient => (
                <ListGroup.Item key={patient.id} className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{patient.firstName} {patient.lastName}</div>
                    <div className="text-muted">{patient.dateOfBirth} • {patient.gender}</div>
                  </div>
                  <Link to={`/patients/${patient.id}`} className="btn btn-sm btn-outline-primary">
                    View
                  </Link>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Recent medical records
  const RecentRecords = () => {
    // Sort records by visit date instead of creation date
    const sortedRecords = [...medicalRecords].sort((a, b) => {
      // Sort by visit date, most recent first
      return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
    });
    
    return (
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Medical Records</h5>
          <Link to="/medical-records" className="btn btn-sm btn-light">View All ({medicalRecordsTotal})</Link>
        </Card.Header>
        <Card.Body>
          {sortedRecords.length === 0 ? (
            <p className="text-muted text-center">No medical records found.</p>
          ) : (
            <ListGroup variant="flush">
              {sortedRecords.slice(0, 5).map(record => {
                const patient = patients.find(p => p.id === record.patientId);
                return (
                  <ListGroup.Item key={record.id}>
                    <div className="d-flex justify-content-between">
                      <div className="fw-bold">{patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}</div>
                      <div className="text-muted">{record.visitDate}</div>
                    </div>
                    <div className="text-truncate">{record.diagnosis}</div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Statistics cards
  const Statistics = () => (
    <Row className="mb-4">
      <Col md={3} sm={6} className="mb-3">
        <Card className="shadow-sm text-center h-100 border-primary">
          <Card.Body>
            <div className="icon-wrapper bg-light rounded-circle mb-2 mx-auto">
              <i className="bi bi-people fs-3 text-primary"></i>
            </div>
            <h2 className="fw-bold">{patients.length}</h2>
            <Card.Text>Total Patients ({patientsTotal})</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3} sm={6} className="mb-3">
        <Card className="shadow-sm text-center h-100 border-success">
          <Card.Body>
            <div className="icon-wrapper bg-light rounded-circle mb-2 mx-auto">
              <i className="bi bi-calendar-check fs-3 text-success"></i>
            </div>
            <h2 className="fw-bold">{appointments.length}</h2>
            <Card.Text>Active Appointments ({appointmentsTotal})</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3} sm={6} className="mb-3">
        <Card className="shadow-sm text-center h-100 border-info">
          <Card.Body>
            <div className="icon-wrapper bg-light rounded-circle mb-2 mx-auto">
              <i className="bi bi-capsule fs-3 text-info"></i>
            </div>
            <h2 className="fw-bold">{medications.length}</h2>
            <Card.Text>Active Medications ({medicationsTotal})</Card.Text>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3} sm={6} className="mb-3">
        <Card className="shadow-sm text-center h-100 border-warning">
          <Card.Body>
            <div className="icon-wrapper bg-light rounded-circle mb-2 mx-auto">
              <i className="bi bi-file-earmark-medical fs-3 text-warning"></i>
            </div>
            <h2 className="fw-bold">{medicalRecords.length}</h2>
            <Card.Text>Medical Records ({medicalRecordsTotal})</Card.Text>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div className="dashboard-container">
      <div className="welcome-header mb-4">
        <h2>Welcome, {currentUser?.firstName || 'User'}</h2>
        <p className="text-muted">
          {userRole === 'DOCTOR' ? 'Doctor Dashboard' : 
           userRole === 'NURSE' ? 'Nurse Dashboard' :
           userRole === 'ADMIN' ? 'Administrator Dashboard' : 'Healthcare Dashboard'}
        </p>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading your dashboard...</p>
        </div>
      ) : (
        <>
          <QuickActions />
          <Statistics />
          
          <Row>
            <Col lg={6}>
              <TodaysAppointments />
            </Col>
            <Col lg={6}>
              <RecentPatients />
            </Col>
          </Row>
          
          <Row>
            <Col lg={12}>
              <RecentRecords />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
