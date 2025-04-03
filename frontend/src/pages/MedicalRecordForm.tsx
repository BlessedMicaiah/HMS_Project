import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Col, Row } from 'react-bootstrap';
import { getMedicalRecord, createMedicalRecord, updateMedicalRecord } from '../services/medicalRecordService';
import { getPatients } from '../services/patientService';
import { MedicalRecord } from '../types/medicalRecord';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';

const MedicalRecordForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    patientId: '',
    doctorId: currentUser?.id || '',
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpNeeded: false,
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [savingAnimation, setSavingAnimation] = useState<boolean>(false);

  useEffect(() => {
    const fetchMedicalRecord = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const data = await getMedicalRecord(id!);
        setFormData({
          patientId: data.patientId,
          doctorId: data.doctorId,
          visitDate: data.visitDate,
          chiefComplaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          treatmentPlan: data.treatmentPlan,
          followUpNeeded: data.followUpNeeded,
          notes: data.notes || ''
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch medical record data');
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
    fetchMedicalRecord();
  }, [id, isEditMode, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle checkbox input type for followUpNeeded
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: e.target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
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
        await updateMedicalRecord(id!, formData);
      } else {
        await createMedicalRecord(formData);
      }
      
      // Delay navigation slightly to show the saving animation
      setTimeout(() => {
        navigate('/medical-records');
      }, 500);
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} medical record`);
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
          {isEditMode ? 'Edit Medical Record' : 'Create New Medical Record'}
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={12}>
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
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Visit Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="visitDate"
                    value={formData.visitDate}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please select a date.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Chief Complaint</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={handleChange}
                    required
                    placeholder="Primary reason for patient visit"
                  />
                  <Form.Control.Feedback type="invalid">Please enter the chief complaint.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Diagnosis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please enter a diagnosis.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Treatment Plan</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="treatmentPlan"
                    value={formData.treatmentPlan}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please enter the treatment plan.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    label="Follow-up Required"
                    name="followUpNeeded"
                    checked={formData.followUpNeeded}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Additional Notes</Form.Label>
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
              <Button variant="outline-secondary" onClick={() => navigate('/medical-records')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading || savingAnimation}
                className={savingAnimation ? 'button-saving' : ''}
              >
                {savingAnimation ? 'Saving...' : isEditMode ? 'Update Record' : 'Create Record'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MedicalRecordForm;
