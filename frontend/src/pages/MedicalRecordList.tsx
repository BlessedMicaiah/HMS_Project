import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Form, InputGroup, Badge } from 'react-bootstrap';
import { getMedicalRecords, deleteMedicalRecord } from '../services/medicalRecordService';
import { MedicalRecord } from '../types/medicalRecord';

const MedicalRecordList = () => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchMedicalRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMedicalRecords();
      setMedicalRecords(response.data);
      setFilteredRecords(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  useEffect(() => {
    // Filter medical records based on search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const result = medicalRecords.filter(record => 
        record.chiefComplaint.toLowerCase().includes(term) ||
        record.diagnosis.toLowerCase().includes(term) ||
        record.visitDate.includes(term)
      );
      setFilteredRecords(result);
    } else {
      setFilteredRecords(medicalRecords);
    }
  }, [searchTerm, medicalRecords]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      try {
        await deleteMedicalRecord(id);
        setMedicalRecords(medicalRecords.filter(record => record.id !== id));
      } catch (err) {
        setError('Failed to delete medical record');
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
        <h2>Medical Records Management</h2>
        <Link to="/medical-records/new">
          <Button variant="success">
            <span className="me-2">➕</span> Add New Medical Record
          </Button>
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Search Toolbar */}
      <div className="hoverable-toolbar mb-4">
        <div className="d-flex flex-wrap w-100 align-items-center">
          <div className="me-3 mb-2 mb-md-0 flex-grow-1">
            <InputGroup>
              <InputGroup.Text className="bg-transparent border-end-0">
                🔍
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search medical records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          
          <div className="d-flex">
            <div 
              className="tool-item"
              onClick={fetchMedicalRecords}
            >
              <span className="tool-icon">🔄</span>
              <span>Refresh</span>
            </div>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <Alert variant="info">
          {searchTerm 
            ? `No medical records found matching "${searchTerm}". Try a different search term.` 
            : 'No medical records found. Add some medical records to get started.'}
        </Alert>
      ) : (
        <Row>
          {filteredRecords.map(record => (
            <Col key={record.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="d-flex justify-content-between align-items-center mb-3">
                    <div>Medical Record</div>
                    <Badge bg={record.followUpNeeded ? 'warning' : 'success'}>
                      {record.followUpNeeded ? 'Follow-up Needed' : 'Completed'}
                    </Badge>
                  </Card.Title>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">📅</span> Visit Date: {record.visitDate}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">🏥</span> Chief Complaint: {record.chiefComplaint}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">🔬</span> Diagnosis: {record.diagnosis}
                  </Card.Text>
                  <Card.Text className="mb-3">
                    <span className="text-muted me-2">💉</span> Treatment: {record.treatmentPlan}
                  </Card.Text>
                  {record.notes && (
                    <Card.Text className="mb-3">
                      <span className="text-muted me-2">📝</span> Notes: {record.notes}
                    </Card.Text>
                  )}
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between">
                      <Link to={`/medical-records/${record.id}`}>
                        <Button variant="primary" size="sm">
                          <span className="tool-icon">👁️</span> View
                        </Button>
                      </Link>
                      <Link to={`/medical-records/${record.id}/edit`}>
                        <Button variant="warning" size="sm">
                          <span className="tool-icon">✏️</span> Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(record.id)}
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

export default MedicalRecordList;
