import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell';

export default function Navbar({ onOpenAI }) {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/profile');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, [location.pathname]); // Re-check on nav

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get('/logout');
      setUser(null);
      navigate('/');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/80 shadow-sm border-b border-gray-200/50 transition-all duration-300">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic">I</div>
            <div className="text-xl font-bold tracking-tight text-gray-900">Inspira</div>
        </Link>
        
        {!isHome && (
          <div className="hidden md:flex flex-1 max-w-2xl px-8">
              {/* Optional: Add search bar back if needed in the future */}
          </div>
        )}

        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
             onClick={onOpenAI}
             className="px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 shadow-md cursor-pointer flex items-center gap-1 transition-opacity"
          >
             <i className="ri-magic-line"></i> AI Magic
          </button>
          
          <Link to="/feed" className="px-4 py-2 text-sm font-semibold rounded-full hover:bg-gray-100 transition-colors text-gray-700">Explore</Link>
          
          {user && <NotificationBell />}
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
                <div 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-gray-200 cursor-pointer overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all flex-shrink-0"
                >
                    {user.profileImage ? (
                        <img src={`http://localhost:3000/images/uploads/${user.profileImage}`} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                        <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">{user.username?.charAt(0).toUpperCase()}</div>
                    )}
                </div>
                
                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.fullname || user.username}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email || `@${user.username}`}</p>
                      </div>
                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">My Profile</Link>
                      <Link to="/add" onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Create Pin</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-medium">Log out</button>
                  </div>
                )}
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md">Log in</Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold rounded-full bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors">Sign up</Link>
            </>
          )}
        </div>
        
    </nav>
  );
}
