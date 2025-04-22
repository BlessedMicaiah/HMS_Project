import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Form, InputGroup, Pagination } from 'react-bootstrap';
import { getMedications, deleteMedication } from '../services/medicationService';
import { Medication } from '../types/medication';
// import { PaginatedResponse } from '../services/patientService';

const MedicationList = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalMedications, setTotalMedications] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMedications(currentPage, perPage);
      // Add null checks for response data
      setMedications(response?.data || []);
      setFilteredMedications(response?.data || []);
      setTotalPages(response?.pagination?.total_pages || 1);
      setTotalMedications(response?.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to fetch medications');
      // Initialize with empty arrays to prevent undefined errors
      setMedications([]);
      setFilteredMedications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  useEffect(() => {
    // Filter medications based on search term
    if (searchTerm && medications && medications.length > 0) {
      const term = searchTerm.toLowerCase();
      const result = medications.filter(medication => 
        medication && 
        ((medication?.name || '').toLowerCase().includes(term) ||
        (medication?.dosage || '').toLowerCase().includes(term) ||
        (medication?.frequency || '').toLowerCase().includes(term))
      );
      setFilteredMedications(result);
    } else {
      setFilteredMedications(medications || []);
    }
  }, [searchTerm, medications]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await deleteMedication(id);
        // Refresh the list after deletion
        fetchMedications();
      } catch (err) {
        console.error('Error deleting medication:', err);
        setError('Failed to delete medication');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Generate pagination items
  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item 
        key={number} 
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

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
        <h2>Medication Management</h2>
        <Link to="/medications/new">
          <Button variant="success">
            <span className="me-2">➕</span> Add New Medication
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
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          
          <div className="d-flex">
            <div 
              className="tool-item"
              onClick={fetchMedications}
            >
              <span className="tool-icon">🔄</span>
              <span>Refresh</span>
            </div>
          </div>
        </div>
      </div>

      {filteredMedications && filteredMedications.length === 0 ? (
        <Alert variant="info">
          {searchTerm 
            ? `No medications found matching "${searchTerm}". Try a different search term.` 
            : 'No medications found. Add some medications to get started.'}
        </Alert>
      ) : (
        <Row>
          {filteredMedications && filteredMedications.map(medication => (
            <Col key={medication.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="mb-3">
                    <span className="me-2">💊</span> {medication.name}
                  </Card.Title>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">📏</span> Dosage: {medication.dosage}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">⏱️</span> Frequency: {medication.frequency}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">📅</span> Start: {medication.startDate}
                  </Card.Text>
                  {medication.endDate && (
                    <Card.Text className="mb-1">
                      <span className="text-muted me-2">🏁</span> End: {medication.endDate}
                    </Card.Text>
                  )}
                  {medication.notes && (
                    <Card.Text className="mb-3">
                      <span className="text-muted me-2">📝</span> Notes: {medication.notes}
                    </Card.Text>
                  )}
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between">
                      <Link to={`/medications/${medication.id}`}>
                        <Button variant="primary" size="sm">
                          <span className="tool-icon">👁️</span> View
                        </Button>
                      </Link>
                      <Link to={`/medications/${medication.id}/edit`}>
                        <Button variant="warning" size="sm">
                          <span className="tool-icon">✏️</span> Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(medication.id)}
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
      
      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          Showing {(filteredMedications || []).length} of {totalMedications} medications
        </div>
        <div>
          <Pagination>
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} />
            {paginationItems}
            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} />
          </Pagination>
        </div>
        <div>
          <Form.Select value={perPage} onChange={handlePerPageChange}>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </Form.Select>
        </div>
      </div>
    </div>
  );
};

export default MedicationList;
