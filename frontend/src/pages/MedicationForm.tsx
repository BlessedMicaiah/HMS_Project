import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Col, Row } from 'react-bootstrap';
import { getMedication, createMedication, updateMedication } from '../services/medicationService';
import { getPatients } from '../services/patientService';
import { Medication } from '../types/medication';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';

const MedicationForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>>({
    patientId: '',
    prescribedBy: currentUser?.id || '',
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    notes: ''
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [savingAnimation, setSavingAnimation] = useState<boolean>(false);

  useEffect(() => {
    const fetchMedication = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const data = await getMedication(id!);
        setFormData({
          patientId: data.patientId,
          prescribedBy: data.prescribedBy,
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          startDate: data.startDate,
          endDate: data.endDate || '',
          notes: data.notes || ''
        });
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch medication data');
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
    fetchMedication();
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
        await updateMedication(id!, formData);
      } else {
        await createMedication(formData);
      }
      
      // Delay navigation slightly to show the saving animation
      setTimeout(() => {
        navigate('/medications');
      }, 500);
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} medication`);
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
          {isEditMode ? 'Edit Medication' : 'Prescribe New Medication'}
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
                  <Form.Label>Medication Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please enter the medication name.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dosage</Form.Label>
                  <Form.Control
                    type="text"
                    name="dosage"
                    value={formData.dosage}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 10mg"
                  />
                  <Form.Control.Feedback type="invalid">Please enter the dosage.</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Frequency</Form.Label>
                  <Form.Control
                    type="text"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Twice daily"
                  />
                  <Form.Control.Feedback type="invalid">Please enter the frequency.</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                  <Form.Control.Feedback type="invalid">Please select a start date.</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
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
                    placeholder="e.g., Take with food, possible side effects, etc."
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between">
              <Button variant="outline-secondary" onClick={() => navigate('/medications')}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={loading || savingAnimation}
                className={savingAnimation ? 'button-saving' : ''}
              >
                {savingAnimation ? 'Saving...' : isEditMode ? 'Update Medication' : 'Prescribe Medication'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default MedicationForm;
