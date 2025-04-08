import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [validated, setValidated] = useState<boolean>(false);
  const { login, error, isLoggedIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || "/patients";

  useEffect(() => {
    // If user is already logged in, redirect to the intended page
    if (isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, from]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }
    
    setValidated(true);
    
    try {
      await login(username, password);
    } catch (err) {
      // Error handling is done in the context
    }
  };

  return (
    <Container className="pt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">Healthcare Portal</h2>
                <p className="text-muted">Log in to access the doctor portal</p>
              </div>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Doctor ID</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter your Doctor ID.
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter your password.
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg" 
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Log In'}
                  </Button>
                </div>
                
                {/*process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                       Development mode: Use "doctor" or "admin" as username (any password)
                    </small>
                  </div>
                )*/}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
