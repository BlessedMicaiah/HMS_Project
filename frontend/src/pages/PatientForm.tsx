import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Col, Row, ProgressBar } from 'react-bootstrap';
import { getPatient, createPatient, updatePatient } from '../services/patientService';
import { Patient } from '../types/patient';
import { useAuth } from '../context/AuthContext';
import '../styles/PatientForm.css';

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
    createdBy: currentUser?.id || ''
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
      // Split by commas, trim whitespace, and filter out empty strings
      const items = value.split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      setFormData(prevData => ({
        ...prevData,
        [name]: items
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
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

  const handleNextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
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
    
    // Only process form submission when on the final step
    if (currentStep < totalSteps) {
      handleNextStep();
      return;
    }
    
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      setLoading(true);
      setSavingAnimation(true);
      setError(null); // Clear any previous errors
      
      // Make sure we have a current user
      if (!currentUser) {
        setError('You must be logged in to create or update a patient');
        setSavingAnimation(false);
        setLoading(false);
        return;
      }
      
      // Prepare the data, include the image if needed
      let patientData = { ...formData };
      
      // Always ensure we set the createdBy field to the current user's ID
      patientData.createdBy = currentUser.id;
      
      console.log('Submitting patient data:', patientData);
      
      // For development mode, use a fallback if the API call fails
      try {
        if (isEditMode && id) {
          console.log(`Updating patient with ID: ${id}`);
          await updatePatient(id, patientData);
        } else {
          console.log('Creating new patient');
          const result = await createPatient(patientData);
          console.log('Patient created successfully:', result);
        }
        
        // Delay navigation slightly to show the saving animation
        setTimeout(() => {
          navigate('/patients');
        }, 500);
      } catch (apiError: any) {
        console.error('API error:', apiError);
        setError(apiError.message || `Failed to ${isEditMode ? 'update' : 'create'} patient`);
        setSavingAnimation(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${isEditMode ? 'update' : 'create'} patient`;
      setError(errorMessage);
      console.error('Form submission error:', err);
      setSavingAnimation(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission to edit all fields
  const canEditMedicalInfo = hasPermission('write');
  const canEditBasicInfo = hasPermission('limited_write') || hasPermission('write');

  // Render appropriate step indicator
  const renderStepIndicator = () => {
    return (
      <div className="step-indicator">
        <ProgressBar now={progress} className="step-progress" />
        <div className="step-labels d-flex justify-content-between">
          <span className={currentStep === 1 ? 'active' : ''}>Basic Info</span>
          <span className={currentStep === 2 ? 'active' : ''}>Contact</span>
          <span className={currentStep === 3 ? 'active' : ''}>Medical History</span>
        </div>
      </div>
    );
  };

  // Render different form sections based on current step
  const renderFormStep = () => {
    if (currentStep === 1) {
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
    }
    else if (currentStep === 2) {
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
    }
    else if (currentStep === 3) {
      return (
        <div className="form-step">
          <div className="step-content">
            <Form.Group className="mb-3">
              <Form.Label>Insurance ID</Form.Label>
              <Form.Control
                type="text"
                name="insuranceId"
                value={formData.insuranceId || ''}
                onChange={handleChange}
                disabled={!canEditMedicalInfo}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Medical Conditions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="medicalConditions"
                value={Array.isArray(formData.medicalConditions) 
                  ? formData.medicalConditions.join(', ') 
                  : formData.medicalConditions || ''}
                onChange={handleChange}
                disabled={!canEditMedicalInfo}
                placeholder="Enter medical conditions separated by commas (e.g., Diabetes, Hypertension, Asthma)"
              />
              <Form.Text className="text-muted">
                List all medical conditions separated by commas.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Allergies</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="allergies"
                value={Array.isArray(formData.allergies) 
                  ? formData.allergies.join(', ') 
                  : formData.allergies || ''}
                onChange={handleChange}
                disabled={!canEditMedicalInfo}
                placeholder="Enter allergies separated by commas (e.g., Penicillin, Peanuts, Shellfish)"
              />
              <Form.Text className="text-muted">
                List all allergies separated by commas.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                disabled={!canEditBasicInfo}
              />
            </Form.Group>
          </div>
        </div>
      );
    }
    
    return null;
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
          <Form noValidate validated={validated} onSubmit={handleSubmit} className="needs-validation">
            {renderStepIndicator()}
            
            <div style={{ minHeight: "400px" }}>
              {/* Render form steps */}
              {currentStep === 1 && (
                <div className="form-step">
                  {renderFormStep()}
                </div>
              )}
              
              {currentStep === 2 && (
                <div className="form-step">
                  {renderFormStep()}
                </div>
              )}
              
              {currentStep === 3 && (
                <div className="form-step">
                  {renderFormStep()}
                </div>
              )}
            </div>
            
            <div className="form-navigation d-flex justify-content-between mt-4 mb-2">
              {currentStep > 1 ? (
                <Button 
                  variant="outline-secondary" 
                  onClick={handlePrevStep}
                  className="navigation-btn prev-btn"
                  disabled={loading}
                  type="button"
                >
                  <span className="btn-icon">⬅️</span> Previous
                </Button>
              ) : (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/patients')}
                  className="navigation-btn cancel-btn"
                  disabled={loading}
                  type="button"
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
                  type="button"
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
