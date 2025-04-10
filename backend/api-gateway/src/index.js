const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');

// Service configurations
const services = {
  patient: {
    url: process.env.PATIENT_SERVICE_URL || 'http://localhost:3001',
    endpoints: ['/api/patients', '/api/appointments', '/api/medications', '/api/medical-records', '/api/auth/login']
  },
  // Add additional services here as your system grows
  // appointment: {
  //   url: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3002',
  //   endpoints: ['/api/appointments']
  // },
  // billing: {
  //   url: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
  //   endpoints: ['/api/bills', '/api/payments']
  // }
};

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined')); // More detailed logging

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic rate limiting middleware
const rateLimit = (maxRequests = 100, timeWindow = 60000) => {
  const requestCounts = {};
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Initialize or reset expired entries
    if (!requestCounts[ip] || now - requestCounts[ip].startTime > timeWindow) {
      requestCounts[ip] = {
        count: 1,
        startTime: now
      };
      return next();
    }
    
    // Increment count for existing entries
    requestCounts[ip].count++;
    
    // Check if rate limit exceeded
    if (requestCounts[ip].count > maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
    
    next();
  };
};

// Apply rate limiting to all requests
app.use(rateLimit());

// Configure routes to services
// Patient Service proxy
app.use('/api/patients', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/patients': '/api/patients'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The patient service is currently unavailable. Please try again later.'
    });
  }
}));

// Appointments proxy
app.use('/api/appointments', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/appointments': '/api/appointments'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The appointments service is currently unavailable. Please try again later.'
    });
  }
}));

// Medications proxy
app.use('/api/medications', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/medications': '/api/medications'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The medications service is currently unavailable. Please try again later.'
    });
  }
}));

// Medical Records proxy
app.use('/api/medical-records', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/medical-records': '/api/medical-records'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The medical records service is currently unavailable. Please try again later.'
    });
  }
}));

// Authentication proxy
app.use('/api/auth', createProxyMiddleware({ 
  target: services.patient.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({
      error: 'Service Unavailable',
      message: 'The authentication service is currently unavailable. Please try again later.'
    });
  }
}));

// Gateway API endpoints
// Health check endpoint with service status
app.get('/health', async (req, res) => {
  try {
    // Check health of each service
    const patientServiceHealth = await checkServiceHealth(services.patient.url);
    
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        'patient-service': patientServiceHealth ? 'UP' : 'DOWN'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'WARNING',
      timestamp: new Date().toISOString(),
      message: 'Could not check health of all services',
      error: error.message
    });
  }
});

// API documentation endpoint
app.get('/api-docs', (req, res) => {
  res.status(200).json({
    apiName: 'Healthcare Management System API',
    version: '1.0.0',
    services: [
      {
        name: 'Patient Service',
        basePath: '/api/patients',
        endpoints: [
          { method: 'GET', path: '/api/patients', description: 'Get all patients' },
          { method: 'GET', path: '/api/patients/:id', description: 'Get patient by ID' },
          { method: 'POST', path: '/api/patients', description: 'Create a new patient' },
          { method: 'PUT', path: '/api/patients/:id', description: 'Update a patient' },
          { method: 'DELETE', path: '/api/patients/:id', description: 'Delete a patient' }
        ]
      },
      {
        name: 'Appointments Service',
        basePath: '/api/appointments',
        endpoints: [
          { method: 'GET', path: '/api/appointments', description: 'Get all appointments' },
          { method: 'GET', path: '/api/appointments/:id', description: 'Get appointment by ID' },
          { method: 'POST', path: '/api/appointments', description: 'Create a new appointment' },
          { method: 'PUT', path: '/api/appointments/:id', description: 'Update an appointment' },
          { method: 'DELETE', path: '/api/appointments/:id', description: 'Delete an appointment' }
        ]
      },
      {
        name: 'Medications Service',
        basePath: '/api/medications',
        endpoints: [
          { method: 'GET', path: '/api/medications', description: 'Get all medications' },
          { method: 'GET', path: '/api/medications/:id', description: 'Get medication by ID' },
          { method: 'POST', path: '/api/medications', description: 'Create a new medication' },
          { method: 'PUT', path: '/api/medications/:id', description: 'Update a medication' },
          { method: 'DELETE', path: '/api/medications/:id', description: 'Delete a medication' }
        ]
      },
      {
        name: 'Medical Records Service',
        basePath: '/api/medical-records',
        endpoints: [
          { method: 'GET', path: '/api/medical-records', description: 'Get all medical records' },
          { method: 'GET', path: '/api/medical-records/:id', description: 'Get medical record by ID' },
          { method: 'POST', path: '/api/medical-records', description: 'Create a new medical record' },
          { method: 'PUT', path: '/api/medical-records/:id', description: 'Update a medical record' },
          { method: 'DELETE', path: '/api/medical-records/:id', description: 'Delete a medical record' }
        ]
      }
    ]
  });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.originalUrl} was not found.`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack}`);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong. Please try again later.',
    timestamp: new Date().toISOString()
  });
});

// Helper function to check service health
async function checkServiceHealth(serviceUrl) {
  try {
    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${serviceUrl}: ${error.message}`);
    return false;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Patient Service proxy configured at ${services.patient.url}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
