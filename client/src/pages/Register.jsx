import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [randomImage] = useState(() => `https://picsum.photos/seed/${Math.random()}/800/1200`);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/register', { fullname, username, email, password });
      if (res.data.success) {
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic">I</div>
          <div className="text-xl font-bold tracking-tight text-gray-900">Inspira</div>
      </Link>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Illustration Side */}
        <div className="hidden md:flex w-1/2 bg-gray-100 p-8 items-center justify-center relative overflow-hidden group">
          <img src={randomImage} alt="Inspiration" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="relative z-10 text-white text-center mt-auto mb-10 px-4">
              <h2 className="text-3xl font-bold mb-2">Join Inspira</h2>
              <p className="text-gray-200 text-sm">Find what you love and save it for later.</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic mx-auto mb-6 text-2xl shadow-md">I</div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome to Inspira</h2>
          <p className="text-center text-gray-500 mb-8 text-sm">Find new ideas to try</p>

          {error && <div className="mb-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Full Name</label>
              <input type="text" value={fullname} onChange={e => setFullname(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="e.g. Jane Doe" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="Choose a username" required />
            </div> 

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="Create a password" required />
            </div>

            <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-full hover:bg-red-700 transition-colors shadow-md mt-4">Continue</button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <hr className="w-full border-gray-200" />
            <span className="absolute bg-white px-4 text-sm text-gray-500 font-medium">OR</span>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button type="button" onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="ri-google-fill text-xl text-red-500"></i> Continue with Google
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed px-4">
            By continuing, you agree to Inspira's <a href="#" className="font-bold text-gray-700">Terms of Service</a> and acknowledge you've read our <a href="#" className="font-bold text-gray-700">Privacy Policy</a>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
                Already a member? <Link to="/login" className="text-gray-900 font-bold hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
