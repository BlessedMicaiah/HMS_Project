import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Row, Col, Alert, Form, InputGroup, Badge, Pagination } from 'react-bootstrap';
import { getAppointments, deleteAppointment } from '../services/appointmentService';
import { Appointment } from '../types/appointment';
// import { PaginatedResponse } from '../services/patientService';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  // const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(10);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAppointments(currentPage, perPage);
      // Add null checks for response data
      setAppointments(response?.data || []);
      setFilteredAppointments(response?.data || []);
      setTotalPages(response?.pagination?.total_pages || 1);
      // setTotalAppointments(response?.pagination?.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments');
      // Initialize with empty arrays to prevent undefined errors
      setAppointments([]);
      setFilteredAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    // Filter appointments based on search term and active filter
    let result = appointments || [];
    
    // Apply search filter
    if (searchTerm && result.length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter(appointment => 
        appointment && 
        ((appointment?.reason || '').toLowerCase().includes(term) ||
        (appointment?.appointmentDate || '').includes(term) ||
        (appointment?.status || '').toLowerCase().includes(term))
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all' && result.length > 0) {
      result = result.filter(appointment => {
        if (!appointment || !appointment.status) return false;
        return appointment.status.toLowerCase() === activeFilter.toLowerCase();
      });
    }
    
    setFilteredAppointments(result);
  }, [searchTerm, activeFilter, appointments]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await deleteAppointment(id);
        // Refresh the list after deletion
        fetchAppointments();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError('Failed to cancel appointment');
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'danger';
      case 'no-show':
        return 'warning';
      default:
        return 'secondary';
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
        <h2>Appointment Management</h2>
        <Link to="/appointments/new">
          <Button variant="success">
            <span className="me-2">➕</span> Add New Appointment
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
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="border-start-0"
              />
            </InputGroup>
          </div>
          
          <div className="d-flex">
            <div 
              className={`tool-item ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              <span className="tool-icon">📆</span>
              <span>All</span>
            </div>
            <div 
              className={`tool-item ${activeFilter === 'scheduled' ? 'active' : ''}`}
              onClick={() => handleFilterChange('scheduled')}
            >
              <span className="tool-icon">⏳</span>
              <span>Scheduled</span>
            </div>
            <div 
              className={`tool-item ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => handleFilterChange('completed')}
            >
              <span className="tool-icon">✅</span>
              <span>Completed</span>
            </div>
            <div 
              className="tool-item"
              onClick={fetchAppointments}
            >
              <span className="tool-icon">🔄</span>
              <span>Refresh</span>
            </div>
          </div>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <Alert variant="info">
          {searchTerm 
            ? `No appointments found matching "${searchTerm}". Try a different search term.` 
            : 'No appointments found. Schedule some appointments to get started.'}
        </Alert>
      ) : (
        <Row>
          {filteredAppointments.map(appointment => (
            <Col key={appointment.id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="d-flex justify-content-between align-items-center">
                    <div>Appointment</div>
                    <Badge bg={getStatusBadgeVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </Card.Title>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">📅</span> {appointment.appointmentDate}
                  </Card.Text>
                  <Card.Text className="mb-1">
                    <span className="text-muted me-2">⏰</span> {appointment.startTime} - {appointment.endTime}
                  </Card.Text>
                  <Card.Text className="mb-3">
                    <span className="text-muted me-2">🏥</span> {appointment.reason}
                  </Card.Text>
                  {appointment.notes && (
                    <Card.Text className="mb-3">
                      <span className="text-muted me-2">📝</span> {appointment.notes}
                    </Card.Text>
                  )}
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between">
                      <Link to={`/appointments/${appointment.id}`}>
                        <Button variant="primary" size="sm">
                          <span className="tool-icon">👁️</span> View
                        </Button>
                      </Link>
                      <Link to={`/appointments/${appointment.id}/edit`}>
                        <Button variant="warning" size="sm">
                          <span className="tool-icon">✏️</span> Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(appointment.id)}
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
      <Pagination className="justify-content-center">
        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} />
        {paginationItems}
        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} />
      </Pagination>
      
      {/* Items per page selector */}
      <Form.Select 
        className="d-inline-block w-auto ms-2" 
        value={perPage} 
        onChange={handlePerPageChange}
      >
        <option value="10">10 per page</option>
        <option value="20">20 per page</option>
        <option value="50">50 per page</option>
      </Form.Select>
    </div>
  );
};

export default AppointmentList;
