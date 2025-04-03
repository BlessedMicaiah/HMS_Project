import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import PatientForm from './pages/PatientForm';
import AppointmentList from './pages/AppointmentList';
import AppointmentForm from './pages/AppointmentForm';
import MedicationList from './pages/MedicationList';
import MedicationForm from './pages/MedicationForm';
import MedicalRecordList from './pages/MedicalRecordList';
import MedicalRecordForm from './pages/MedicalRecordForm';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  
  // Don't show navbar on login page
  const showNavbar = location.pathname !== '/login';

  return (
    <div className="app-container">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "container mt-4" : ""}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Redirect root to login if not logged in, otherwise to dashboard */}
          <Route 
            path="/" 
            element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Protected routes */}
          <Route path="/patients" element={
            <ProtectedRoute>
              <PatientList />
            </ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute>
              <PatientForm />
            </ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute>
              <PatientDetail />
            </ProtectedRoute>
          } />
          <Route path="/patients/:id/edit" element={
            <ProtectedRoute>
              <PatientForm />
            </ProtectedRoute>
          } />
          
          {/* New Routes for Database Features */}
          <Route path="/appointments" element={
            <ProtectedRoute>
              <AppointmentList />
            </ProtectedRoute>
          } />
          <Route path="/appointments/new" element={
            <ProtectedRoute>
              <AppointmentForm />
            </ProtectedRoute>
          } />
          <Route path="/appointments/:id/edit" element={
            <ProtectedRoute>
              <AppointmentForm />
            </ProtectedRoute>
          } />
          <Route path="/medications" element={
            <ProtectedRoute>
              <MedicationList />
            </ProtectedRoute>
          } />
          <Route path="/medications/new" element={
            <ProtectedRoute>
              <MedicationForm />
            </ProtectedRoute>
          } />
          <Route path="/medications/:id/edit" element={
            <ProtectedRoute>
              <MedicationForm />
            </ProtectedRoute>
          } />
          <Route path="/medical-records" element={
            <ProtectedRoute>
              <MedicalRecordList />
            </ProtectedRoute>
          } />
          <Route path="/medical-records/new" element={
            <ProtectedRoute>
              <MedicalRecordForm />
            </ProtectedRoute>
          } />
          <Route path="/medical-records/:id/edit" element={
            <ProtectedRoute>
              <MedicalRecordForm />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
