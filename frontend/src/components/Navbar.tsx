import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import '../styles/FuturisticNavbar.css';

interface User {
  firstName?: string;
  lastName?: string;
  role?: string;
}

const Navbar = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className={`futuristic-navbar ${expanded ? 'expanded' : ''}`}>
      <Container fluid className="navbar-container">
        <div className="navbar-brand-container">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">⚕</span>
            <span className="brand-text">HealthHub</span>
            <span className="brand-suffix">Pro</span>
          </Link>
          <button 
            className="mobile-toggle" 
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle navigation"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        <div className={`navbar-links ${expanded ? 'show' : ''}`}>
          <div className="nav-item-container">
            <Link 
              to="/dashboard" 
              className={`nav-item ${isActive('/dashboard')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">🏠</div>
              <span className="nav-text">Dashboard</span>
            </Link>
            
            <Link 
              to="/patients" 
              className={`nav-item ${isActive('/patients')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">👥</div>
              <span className="nav-text">Patients</span>
            </Link>
            
            <Link 
              to="/appointments" 
              className={`nav-item ${isActive('/appointments')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">📅</div>
              <span className="nav-text">Appts</span>
            </Link>

            <Link 
              to="/medications" 
              className={`nav-item ${isActive('/medications')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">💊</div>
              <span className="nav-text">Meds</span>
            </Link>

            <Link 
              to="/medical-records" 
              className={`nav-item ${isActive('/medical-records')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">📋</div>
              <span className="nav-text">Records</span>
            </Link>
            
            <Link 
              to="/patients/new" 
              className={`nav-item ${isActive('/patients/new')}`}
              onClick={() => setExpanded(false)}
            >
              <div className="nav-icon">➕</div>
              <span className="nav-text">Add</span>
            </Link>

            {currentUser && (
              <button 
                onClick={() => {
                  logout();
                  setExpanded(false);
                }} 
                className="nav-item logout-button"
              >
                <div className="nav-icon">🔒</div>
                <span className="nav-text">Logout</span>
              </button>
            )}
          </div>
        </div>
        
        {currentUser && (
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.firstName?.charAt(0) || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name">{`${currentUser.firstName} ${currentUser.lastName}`}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Navbar;
