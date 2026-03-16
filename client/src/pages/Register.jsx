import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export default function Register() {
  const [randomImage] = useState(() => `https://picsum.photos/seed/${Math.random()}/800/1200`);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP States
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // First, let's send the OTP
    try {
      const res = await axios.post('/send-otp', { email });
      if (res.data.success) {
        setShowOtpInput(true);
        setSuccessMsg('OTP sent to your email. Please check your inbox.');
        if (res.data.previewUrl) setPreviewUrl(res.data.previewUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and ultimately Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Very OTP
      const verifyRes = await axios.post('/verify-otp', { email, otp });
      
      if (verifyRes.data.success) {
        // If OTP is good, proceed with actual registration
        const registerRes = await axios.post('/register', { fullname, username, email, password });
        if (registerRes.data.success) {
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${BACKEND_URL}/auth/google`; // Re-add if passport Google OAuth is re-enabled, else hide
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
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          
          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic mx-auto mb-6 text-2xl shadow-md">I</div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Welcome to Inspira</h2>
          <p className="text-center text-gray-500 mb-8 text-sm">Find new ideas to try</p>

          {error && <div className="mb-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          {successMsg && <div className="mb-4 text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">{successMsg}</div>}

          {!showOtpInput ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4 animate-fade-in-up">
              <div>
                <label htmlFor="reg-fullname" className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Full Name</label>
                <input id="reg-fullname" name="fullname" type="text" value={fullname} onChange={e => setFullname(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="e.g. Jane Doe" required />
              </div>

              <div>
                <label htmlFor="reg-username" className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Username</label>
                <input id="reg-username" name="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="Choose a username" required />
              </div> 

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Email</label>
                <input id="reg-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="you@example.com" required />
              </div>

              <div>
                <label htmlFor="reg-password" name="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Password</label>
                <input id="reg-password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="Create a password" required />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-full hover:bg-red-700 transition-all shadow-md mt-4 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70">
                {loading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-5 animate-fade-in-up">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center">
                   <p className="text-gray-600 text-sm font-medium">Verify your email address <span className="text-red-600 mx-1">{email}</span></p>
                   {previewUrl && (
                      <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-colors">
                        <i className="ri-mail-open-line mr-1"></i> Open Test Inbox (Dev Mode)
                      </a>
                   )}
                </div>
                
                <div>
                  <label htmlFor="reg-otp" className="block text-sm font-medium text-gray-700 mb-1 ml-1 flex justify-between">
                    <span>Enter 6-digit OTP</span>
                    <button type="button" onClick={() => setShowOtpInput(false)} className="text-red-500 text-xs hover:underline cursor-pointer font-semibold">Change Info</button>
                  </label>
                  <input 
                    id="reg-otp"
                    name="otp"
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)} 
                    maxLength={6}
                    className="w-full bg-white border-2 border-gray-200 px-4 py-4 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-2xl tracking-widest text-center font-bold text-gray-900 placeholder-gray-300" 
                    placeholder="------" 
                    required 
                  />
                </div>

                <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-red-600 text-white font-bold py-4 px-4 rounded-full hover:bg-red-700 transition-colors shadow-md mt-2 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : 'Verify & Setup Account'}
                </button>
            </form>
          )}

          {/* <div className="mt-8 relative flex items-center justify-center">
            <hr className="w-full border-gray-200" />
            <span className="absolute bg-white px-4 text-sm text-gray-500 font-medium">OR</span>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button type="button" onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
              <i className="ri-google-fill text-xl text-red-500"></i> Continue with Google
            </button>
          </div> */}

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
