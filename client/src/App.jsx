import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';

// --- Pages ---
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import SuperCoordinatorDashboard from './pages/SuperCoordinatorDashboard';
import MentorDashboard from './pages/MentorDashboard';
import MenteeDashboard from './pages/MenteeDashboard';

// --- Google Auth Callback Handler ---
// This component catches the token from the backend redirect and saves it
const GoogleAuthHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    
    if (token) {
      localStorage.setItem('token', token);
      
      // Save user data if passed via URL (optional but recommended)
      if (userParam) {
        try {
          localStorage.setItem('user', decodeURIComponent(userParam));
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      
      // Redirect to admin dashboard for now
      // In production, you might want to fetch the user's role first
      navigate('/admin-dashboard'); 
    } else {
      // No token? Send back to login
      navigate('/');
    }
  }, [searchParams, navigate]);

  return <div className="min-h-screen flex items-center justify-center">Completing login...</div>;
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 1. Check if user is logged in (by token)
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. If we have user data, check role
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    const rolePrefix = user.role === 'super_coordinator' ? 'super_coordinator' : user.role;
    return <Navigate to={`/${rolePrefix}-dashboard`} replace />;
  }

  // 3. Allow access (dashboard can fetch fresh user data on mount if needed)
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* ✅ NEW: Handle Google OAuth Redirect */}
        <Route path="/dashboard" element={<GoogleAuthHandler />} />

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
          path="/super-coordinator-dashboard" 
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