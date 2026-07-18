import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- Pages ---
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import SuperCoordinatorDashboard from './pages/SuperCoordinatorDashboard';
import MentorDashboard from './pages/MentorDashboard';
import MenteeDashboard from './pages/MenteeDashboard';

// --- Protected Route Component ---
// This ensures only users with the correct role can access specific dashboards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 1. Check if user is logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 2. Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access someone else's
    return <Navigate to={`/${user.role === 'super_coordinator' ? 'super_coordinator' : user.role}-dashboard`} replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Super Coordinator Routes */}
        <Route 
          path="/super_coordinator-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['super_coordinator']}>
              <SuperCoordinatorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Coordinator Routes */}
        <Route 
          path="/coordinator-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Mentor Routes */}
        <Route 
          path="/mentor-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Mentee Routes */}
        <Route 
          path="/mentee-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['mentee']}>
              <MenteeDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback: Redirect to login if route not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}