//RoleBasedRouter.js
import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';
import AdminDashboard from './AdminDashboard';

const RoleBasedRouter = ({ isAuthenticated, userRole, setIsAuthenticated, setUserRole }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
      <Route
        path="/doctor"
        element={
          <PrivateRoute
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            requiredRole="doctor"
          >
            <DoctorDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <PrivateRoute
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            requiredRole="patient"
          >
            <PatientDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute
            isAuthenticated={isAuthenticated}
            userRole={userRole}
            requiredRole="admin"
          >
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const PrivateRoute = ({ children, isAuthenticated, userRole, requiredRole }) => {
  if (isAuthenticated && userRole === requiredRole) {
    return children;
  }
  return <Navigate to="/login" replace />;
};


export default RoleBasedRouter;