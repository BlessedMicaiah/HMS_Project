import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import PatientList from './pages/PatientList';
import PatientDetail from './pages/PatientDetail';
import PatientForm from './pages/PatientForm';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="container mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/patients" />} />
          <Route path="/patients" element={<PatientList />} />
          <Route path="/patients/new" element={<PatientForm />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/patients/:id/edit" element={<PatientForm />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
