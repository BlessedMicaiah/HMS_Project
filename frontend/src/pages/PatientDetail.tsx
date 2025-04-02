import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Alert, Row, Col } from 'react-bootstrap';
import { getPatient, deletePatient } from '../services/patientService';
import { Patient } from '../types/patient';

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getPatient(id);
        setPatient(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch patient details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(id);
        navigate('/patients');
      } catch (err) {
        setError('Failed to delete patient');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="text-center my-5">Loading patient details...</div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!patient) {
    return <Alert variant="warning">Patient not found</Alert>;
  }

  return (
    <div className="detail-container">
      <div className="detail-header d-flex justify-content-between align-items-center">
        <h2>Patient Details</h2>
        <div>
          <Link to="/patients" className="me-2">
            <Button variant="secondary">Back to List</Button>
          </Link>
          <Link to={`/patients/${id}/edit`} className="me-2">
            <Button variant="warning">Edit</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="detail-section">
                <h4>Basic Information</h4>
                <p><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
                <p><strong>Date of Birth:</strong> {patient.dateOfBirth}</p>
                <p><strong>Gender:</strong> {patient.gender}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detail-section">
                <h4>Contact Information</h4>
                <p><strong>Email:</strong> {patient.email}</p>
                <p><strong>Phone:</strong> {patient.phone}</p>
                <p><strong>Address:</strong> {patient.address}</p>
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col md={12}>
              <div className="detail-section">
                <h4>Medical Information</h4>
                <p><strong>Insurance ID:</strong> {patient.insuranceId || 'Not provided'}</p>
                <p><strong>Medical Conditions:</strong> {patient.medicalConditions?.join(', ') || 'None'}</p>
                <p><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None'}</p>
              </div>
            </Col>
          </Row>
          
          <div className="detail-section">
            <h4>Additional Notes</h4>
            <p>{patient.notes || 'No additional notes'}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientDetail;
