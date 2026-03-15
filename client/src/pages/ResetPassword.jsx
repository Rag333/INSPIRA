import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/forgot-password', { email });
      if (res.data.success) {
        setStep(2);
        setSuccessMsg(res.data.message || 'OTP sent to your email.');
        if (res.data.previewUrl) setPreviewUrl(res.data.previewUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post('/reset-password', { email, otp, newPassword });
      if (res.data.success) {
        setSuccessMsg('Password reset successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic">I</div>
          <div className="text-xl font-bold tracking-tight text-gray-900">Inspira</div>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-10 flex flex-col justify-center relative">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold italic mx-auto mb-6 text-2xl shadow-md">I</div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Reset Password</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">Let's get you back into your account</p>

        {error && <div className="mb-4 text-center text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
        {successMsg && <div className="mb-4 text-center text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">{successMsg}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">Account Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="you@example.com" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-full hover:bg-red-700 transition-all shadow-md mt-4 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70">
              {loading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4 animate-fade-in-up">
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center mb-2">
                 <p className="text-gray-600 text-sm font-medium">Verify code sent to <span className="text-red-600 mx-1">{email}</span></p>
                 {previewUrl && (
                    <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs font-bold rounded-lg transition-colors">
                      <i className="ri-mail-open-line mr-1"></i> Open Test Inbox (Dev Mode)
                    </a>
                 )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 flex justify-between">
                  <span>Enter 6-digit OTP</span>
                  <button type="button" onClick={() => setStep(1)} className="text-red-500 text-xs hover:underline cursor-pointer font-semibold">Wrong email?</button>
                </label>
                <input 
                  type="text" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  maxLength={6}
                  className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-xl tracking-widest text-center font-bold text-gray-900 placeholder-gray-300" 
                  placeholder="------" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1 cursor-pointer">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white border-2 border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-sm font-medium placeholder-gray-400" placeholder="Create a new password" required />
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-full hover:bg-red-700 transition-colors shadow-md mt-4 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <i className="ri-loader-4-line animate-spin text-xl"></i> : 'Reset & Login'}
              </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center flex justify-between px-2">
          <Link to="/login" className="text-sm text-gray-600 font-bold hover:underline">Back to Login</Link>
          <Link to="/register" className="text-sm text-gray-600 font-bold hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
