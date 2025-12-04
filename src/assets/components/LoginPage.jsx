import React, { useState } from 'react';
import { requestOTP, verifyOTP } from '../../services/api';

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter a phone number");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await requestOTP(phone);
      setOtpSent(true);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!phone || !otp) {
      setError("Please enter phone and OTP");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const result = await verifyOTP(phone, otp);
      onLogin(phone);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Login</h1>
      
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-md relative">
        <div className="absolute top-4 left-4 w-2 h-2 bg-slate-200 rounded-full"></div>
        <div className="absolute top-4 right-4 w-2 h-2 bg-slate-200 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-2 h-2 bg-slate-200 rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-slate-200 rounded-full"></div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={!otpSent ? handleRequestOTP : handleVerifyOTP} className="flex flex-col gap-6">
          <div>
            <label className="block text-slate-600 font-medium mb-2">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+91 00000 00000"
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={otpSent || loading}
            />
          </div>

          {otpSent && (
            <div>
              <label className="block text-slate-600 font-medium mb-2">OTP</label>
              <input 
                type="password" 
                placeholder="• • • •"
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (otpSent ? 'Verify & Login' : 'Request OTP')}
          </button>

          {otpSent && (
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setError('');
              }}
              className="text-blue-600 hover:underline text-sm"
            >
              Use different phone number
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
