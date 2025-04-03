import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isLoggedIn, userRole, loading } = useAuth();
  const location = useLocation();

  // If still loading auth state, show nothing or a loading spinner
  if (loading) {
    return <div className="d-flex justify-content-center p-5">Loading...</div>;
  }

  // Check if user is logged in
  if (!isLoggedIn) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="container mt-5 text-center">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  // If user is authenticated and has the required role (if any), render the children
  return <>{children}</>;
};

export default ProtectedRoute;
