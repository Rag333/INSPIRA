import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Add from './pages/Add';
import AIPortal from './components/AIPortal';
import UserProfile from './pages/UserProfile';

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';
  const [aiPortalOpen, setAiPortalOpen] = useState(false);
  
  return (
    <>
      {!hideNavbar && <Navbar onOpenAI={() => setAiPortalOpen(true)} />}
      <AIPortal isOpen={aiPortalOpen} onClose={() => setAiPortalOpen(false)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add" element={<Add />} />
        <Route path="/user/:username" element={<UserProfile />} />
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
