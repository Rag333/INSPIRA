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

// A lightweight protection wrapper checking the active session
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  useEffect(() => {
    axios.get('/profile')
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  if (isAuthenticated === null) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><i className="ri-loader-4-line animate-spin text-4xl text-red-600"></i></div>;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
  const [aiPortalOpen, setAiPortalOpen] = useState(false);
  
  return (
    <>
      {!hideNavbar && <Navbar onOpenAI={() => setAiPortalOpen(true)} />}
      <AIPortal isOpen={aiPortalOpen} onClose={() => setAiPortalOpen(false)} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      <Layout />
    </Router>
  )
}

export default App;
