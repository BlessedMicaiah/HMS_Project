import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap';
import { getPatients, deletePatient } from '../services/patientService';
import { Patient } from '../types/patient';

const PatientList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const location = useLocation();

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
      setFilteredPatients(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients, location.key]); // Re-fetch when location changes (navigation)

  useEffect(() => {
    // Filter patients based on search term and active filter
    let result = patients;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(patient => 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        patient.phone.includes(term)
      );
    }
    
    // Apply category filter
    if (activeFilter !== 'all') {
      result = result.filter(patient => {
        if (activeFilter === 'male') return patient.gender.toLowerCase() === 'male';
        if (activeFilter === 'female') return patient.gender.toLowerCase() === 'female';
        return true;
      });
    }
    
    setFilteredPatients(result);
  }, [searchTerm, activeFilter, patients]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(id);
        setPatients(patients.filter(patient => patient.id !== id));
      } catch (err) {
        setError('Failed to delete patient');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Patient Management</h2>
        <Link to="/patients/new">
          <Button variant="success">
            <span className="me-2">➕</span> Add New Patient
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Search and Filter Toolbar */}
      <div className="hoverable-toolbar mb-4">
        <div className="d-flex flex-wrap w-100 align-items-center">
          <div className="me-3 mb-2 mb-md-0 flex-grow-1">
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-end-0">
                🔍
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          
          <div className="d-flex">
            <div 
              className={`tool-item ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span className="tool-icon">👥</span>
              <span>All</span>
            </div>
            <div 
              className={`tool-item ${activeFilter === 'male' ? 'active' : ''}`}
              onClick={() => setActiveFilter('male')}
            >
              <span className="tool-icon">👨</span>
              <span>Male</span>
            </div>
            <div 
              className={`tool-item ${activeFilter === 'female' ? 'active' : ''}`}
              onClick={() => setActiveFilter('female')}
            >
              <span className="tool-icon">👩</span>
              <span>Female</span>
            </div>
            <div 
              className="tool-item"
              onClick={fetchPatients}
            >
              <span className="tool-icon">🔄</span>
              <span>Refresh</span>
            </div>
          </div>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Alert variant="info">
          {searchTerm 
            ? `No patients found matching "${searchTerm}". Try a different search term.` 
            : 'No patients found. Add some patients to get started.'}
        </Alert>
      ) : (
        <Row>
          {filteredPatients.map(patient => (
            <Col key={patient.id} md={6} lg={4} className="mb-4">
              <Card className="patient-card h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="patient-info">
                    {patient.profileImageUrl ? (
                      <div className="patient-avatar mb-3">
                        <img 
                          src={patient.profileImageUrl} 
                          alt={`${patient.firstName} ${patient.lastName}`}
                          className="rounded-circle"
                          width="50"
                          height="50"
                        />
                      </div>
                    ) : (
                      <div className="patient-avatar mb-3">
                        <div className="avatar-placeholder">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </div>
                      </div>
                    )}
                    <Card.Title className="mb-3">{patient.firstName} {patient.lastName}</Card.Title>
                    <Card.Text className="mb-1">
                      <span className="text-muted me-2">📧</span> {patient.email}
                    </Card.Text>
                    <Card.Text className="mb-1">
                      <span className="text-muted me-2">📞</span> {patient.phone}
                    </Card.Text>
                    <Card.Text className="mb-3">
                      <span className="text-muted me-2">⚥</span> {patient.gender}
                    </Card.Text>
                  </div>
                  
                  <div className="patient-actions mt-auto">
                    <div className="d-flex justify-content-between">
                      <Link to={`/patients/${patient.id}`}>
                        <Button variant="primary" size="sm">
                          <span className="tool-icon">👁️</span> View
                        </Button>
                      </Link>
                      <Link to={`/patients/${patient.id}/edit`}>
                        <Button variant="warning" size="sm">
                          <span className="tool-icon">✏️</span> Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(patient.id)}
                      >
                        <span className="tool-icon">🗑️</span> Delete
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default PatientList;
