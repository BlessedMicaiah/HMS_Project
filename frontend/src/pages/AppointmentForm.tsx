import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Col, Row } from 'react-bootstrap';
import { getAppointment, createAppointment, updateAppointment } from '../services/appointmentService';
import { getPatients } from '../services/patientService';
import { Appointment } from '../types/appointment';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';

const AppointmentForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>>({
    patientId: '',
    doctorId: currentUser?.id || '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    reason: '',
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [savingAnimation, setSavingAnimation] = useState<boolean>(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const data = await getAppointment(id!);
        setFormData({
          patientId: data.patientId,
          doctorId: data.doctorId,
          appointmentDate: data.appointmentDate,
          startTime: data.startTime,
          endTime: data.endTime,
          status: data.status,
          reason: data.reason,
          notes: data.notes || ''
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch appointment data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data.data);
      } catch (err) {
        console.error('Failed to fetch patient list:', err);
      }
    };

    fetchPatients();
    fetchAppointment();
  }, [id, isEditMode, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      setSavingAnimation(true);
      
      if (isEditMode) {
        await updateAppointment(id!, formData);
      } else {
        await createAppointment(formData);
      }
      
      // Delay navigation slightly to show the saving animation
      setTimeout(() => {
        navigate('/appointments');
      }, 500);
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} appointment`);
      console.error(err);
      setSavingAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <Card className="shadow-sm mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          {isEditMode ? 'Edit Appointment' : 'Schedule New Appointment'}
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Patient</Form.Label>
                  <Form.Select 
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">Please select a patient.</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select 
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="NO_SHOW">No Show</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please select a date.</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please select a start time.</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please select an end time.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Reason for Visit</Form.Label>
                  <Form.Control
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    maxLength={200}
                  />
                  <Form.Control.Feedback type="invalid">Please provide a reason for the visit.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate('/appointments')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading || savingAnimation}
                className={savingAnimation ? 'button-saving' : ''}
              >
                {savingAnimation ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Schedule Appointment'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AppointmentForm;
