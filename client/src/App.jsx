import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Add from './pages/Add';
import AIPortal from './components/AIPortal';
import UserProfile from './pages/UserProfile';
import ResetPassword from './pages/ResetPassword';

import { AuthProvider, useAuth } from './context/AuthContext';

// A lightweight protection wrapper checking the active session
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <i className="ri-loader-4-line animate-spin text-4xl text-red-600"></i>
    </div>
  );

  return user ? children : <Navigate to="/" replace />;
};

function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
  const [aiPortalOpen, setAiPortalOpen] = useState(false);
  
  return (
    <>
      {!hideNavbar && <Navbar onOpenAI={() => setAiPortalOpen(true)} />}
      <AIPortal isOpen={aiPortalOpen} onClose={() => setAiPortalOpen(false)} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/feed" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/feed" /> : <Register />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/add" element={<ProtectedRoute><Add /></ProtectedRoute>} />
        <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  )
}

export default App;
