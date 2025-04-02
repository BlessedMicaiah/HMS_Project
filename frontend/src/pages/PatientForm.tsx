import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Col, Row, ProgressBar } from 'react-bootstrap';
import { getPatient, createPatient, updatePatient } from '../services/patientService';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';

const PatientForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { hasPermission, currentUser } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<Omit<Patient, 'id'>>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    insuranceId: '',
    medicalConditions: [],
    allergies: [],
    notes: '',
    profileImageUrl: '',
    createdBy: currentUser?.id
  });
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formTouched, setFormTouched] = useState<boolean>(false);
  const [savingAnimation, setSavingAnimation] = useState<boolean>(false);

  // Total number of steps in the form wizard
  const totalSteps = 3;

  // Progress calculation for the step indicator
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const fetchPatient = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        const data = await getPatient(id!);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          email: data.email,
          phone: data.phone,
          address: data.address,
          insuranceId: data.insuranceId || '',
          medicalConditions: data.medicalConditions || [],
          allergies: data.allergies || [],
          notes: data.notes || '',
          profileImageUrl: data.profileImageUrl || '',
          createdBy: data.createdBy || currentUser?.id
        });
        
        if (data.profileImageUrl) {
          setPreviewImage(data.profileImageUrl);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch patient data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, isEditMode, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (!formTouched) {
      setFormTouched(true);
    }
    
    if (name === 'medicalConditions' || name === 'allergies') {
      setFormData({
        ...formData,
        [name]: value.split(',').map(item => item.trim()).filter(item => item !== '')
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should not exceed 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      
      // Store the base64 string in formData for submission
      setFormData({
        ...formData,
        profileImage: result // This will be converted to profileImageUrl on the server
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    // Basic validation for each step
    switch (currentStep) {
      case 1: // Basic info
        return !!formData.firstName && !!formData.lastName && !!formData.dateOfBirth && !!formData.gender;
      case 2: // Contact info
        return !!formData.email && !!formData.phone && !!formData.address;
      case 3: // Medical info
        return true; // Medical info fields are optional
      default:
        return true;
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
        await updatePatient(id!, formData);
      } else {
        await createPatient(formData);
      }
      
      // Delay navigation slightly to show the saving animation
      setTimeout(() => {
        navigate('/patients');
      }, 500);
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} patient`);
      console.error(err);
      setSavingAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to edit all fields
  const canEditMedicalInfo = hasPermission('write');
  const canEditBasicInfo = hasPermission('limited_write') || hasPermission('write');

  if (loading && isEditMode) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="step-indicator mb-4">
      <div className="step-labels d-flex justify-content-between mb-2">
        <span className={`step-label ${currentStep >= 1 ? 'active' : ''}`}>Basic Info</span>
        <span className={`step-label ${currentStep >= 2 ? 'active' : ''}`}>Contact</span>
        <span className={`step-label ${currentStep >= 3 ? 'active' : ''}`}>Medical</span>
      </div>
      <div className="custom-progress">
        <ProgressBar now={progress} variant="info" />
      </div>
    </div>
  );

  // Render different form sections based on current step
  const renderFormStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="form-step">
            <Row className="step-content">
              <Col md={4} className="mb-3 text-center">
                <Form.Group controlId="profileImage">
                  <Form.Label>Profile Image</Form.Label>
                  <div className="profile-image-preview mb-3">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Patient" 
                        className="profile-img" 
                      />
                    ) : (
                      <div className="profile-placeholder">
                        <span>📷</span>
                      </div>
                    )}
                  </div>
                  {canEditBasicInfo && (
                    <div className="file-upload-wrapper">
                      <Form.Control
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="custom-file-input"
                      />
                      <Button variant="outline-primary" className="upload-btn">
                        Choose Image
                      </Button>
                    </div>
                  )}
                </Form.Group>
              </Col>
              
              <Col md={8}>
                <div className="input-group-animated">
                  <Form.Group className="floating-group mb-4" controlId="firstName">
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      disabled={!canEditBasicInfo}
                      className="floating-input"
                    />
                    <Form.Label className="floating-label">First Name</Form.Label>
                    <Form.Control.Feedback type="invalid">
                      Please provide a first name.
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="floating-group mb-4" controlId="lastName">
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      disabled={!canEditBasicInfo}
                      className="floating-input"
                    />
                    <Form.Label className="floating-label">Last Name</Form.Label>
                    <Form.Control.Feedback type="invalid">
                      Please provide a last name.
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="floating-group mb-4" controlId="dateOfBirth">
                        <Form.Control
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          required
                          disabled={!canEditBasicInfo}
                          className="floating-input"
                        />
                        <Form.Label className="floating-label">Date of Birth</Form.Label>
                        <Form.Control.Feedback type="invalid">
                          Please provide a date of birth.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-4" controlId="gender">
                        <Form.Label className="select-label">Gender</Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                          disabled={!canEditBasicInfo}
                          className="custom-select"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          Please select a gender.
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <div className="step-content input-group-animated">
              <Row>
                <Col md={6}>
                  <Form.Group className="floating-group mb-4" controlId="email">
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      disabled={!canEditBasicInfo}
                      className="floating-input"
                    />
                    <Form.Label className="floating-label">Email</Form.Label>
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid email.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="floating-group mb-4" controlId="phone">
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder=" "
                      required
                      disabled={!canEditBasicInfo}
                      className="floating-input"
                    />
                    <Form.Label className="floating-label">Phone</Form.Label>
                    <Form.Control.Feedback type="invalid">
                      Please provide a phone number.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="floating-group mb-4" controlId="address">
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  disabled={!canEditBasicInfo}
                  className="floating-input textarea-input"
                />
                <Form.Label className="floating-label">Address</Form.Label>
                <Form.Control.Feedback type="invalid">
                  Please provide an address.
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <div className="step-content input-group-animated">
              <Form.Group className="floating-group mb-4" controlId="insuranceId">
                <Form.Control
                  type="text"
                  name="insuranceId"
                  value={formData.insuranceId}
                  onChange={handleChange}
                  placeholder=" "
                  disabled={!canEditMedicalInfo}
                  className="floating-input"
                />
                <Form.Label className="floating-label">Insurance ID</Form.Label>
              </Form.Group>
              
              <Form.Group className="floating-group mb-4" controlId="medicalConditions">
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="medicalConditions"
                  value={formData.medicalConditions?.join(', ')}
                  onChange={handleChange}
                  placeholder=" "
                  disabled={!canEditMedicalInfo}
                  className="floating-input textarea-input"
                />
                <Form.Label className="floating-label">Medical Conditions (comma-separated)</Form.Label>
              </Form.Group>
              
              <Form.Group className="floating-group mb-4" controlId="allergies">
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="allergies"
                  value={formData.allergies?.join(', ')}
                  onChange={handleChange}
                  placeholder=" "
                  disabled={!canEditMedicalInfo}
                  className="floating-input textarea-input"
                />
                <Form.Label className="floating-label">Allergies (comma-separated)</Form.Label>
              </Form.Group>
              
              <Form.Group className="floating-group mb-4" controlId="notes">
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder=" "
                  disabled={!canEditBasicInfo}
                  className="floating-input textarea-input"
                />
                <Form.Label className="floating-label">Notes</Form.Label>
              </Form.Group>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Patient' : 'Add New Patient'}</h2>
        <div className="form-subtitle">
          <span className="current-step-label">Step {currentStep} of {totalSteps}: </span>
          <span className="step-title">
            {currentStep === 1 ? 'Basic Information' : 
              currentStep === 2 ? 'Contact Details' : 'Medical History'}
          </span>
        </div>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="form-card">
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            {renderStepIndicator()}
            
            {renderFormStep()}
            
            <div className="form-navigation d-flex justify-content-between mt-4 mb-2">
              {currentStep > 1 ? (
                <Button 
                  variant="outline-secondary" 
                  onClick={handlePrevStep}
                  className="navigation-btn prev-btn"
                  disabled={loading}
                >
                  <span className="btn-icon">⬅️</span> Previous
                </Button>
              ) : (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/patients')}
                  className="navigation-btn cancel-btn"
                  disabled={loading}
                >
                  <span className="btn-icon">❌</span> Cancel
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button 
                  variant="primary" 
                  onClick={handleNextStep}
                  className="navigation-btn next-btn"
                  disabled={loading || !validateCurrentStep()}
                >
                  Next <span className="btn-icon">➡️</span>
                </Button>
              ) : (
                <Button 
                  variant="success" 
                  type="submit"
                  className={`navigation-btn submit-btn ${savingAnimation ? 'saving' : ''}`}
                  disabled={loading || (!canEditBasicInfo && !canEditMedicalInfo)}
                >
                  {loading ? (
                    <>Saving <span className="saving-dots"><span>.</span><span>.</span><span>.</span></span></>
                  ) : (
                    <>{isEditMode ? 'Update Patient' : 'Save Patient'} <span className="btn-icon">💾</span></>
                  )}
                </Button>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientForm;
