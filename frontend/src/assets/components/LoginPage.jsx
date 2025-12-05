import React, { useState } from 'react';
import { requestOTP } from '../../services/api';

export default function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError('Please enter phone and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await requestOTP(phone, password);
      
      // Session cookie is set automatically by the backend
      // Mark as authenticated in localStorage for UI state only
      localStorage.setItem('authToken', 'session');
      
      onLogin(phone);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ position: 'relative', borderRadius: 20, padding: 28, boxShadow: '0 12px 30px rgba(2,6,23,0.12)', background: '#ffffff', border: '1px solid rgba(2,6,23,0.06)' }}>
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#00f0ff,#0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,240,255,0.4)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="none"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="none"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="none"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" fill="none"/>
              <line x1="10" y1="6.5" x2="14" y2="6.5" stroke="white" strokeWidth="2"/>
              <line x1="6.5" y1="10" x2="6.5" y2="14" stroke="white" strokeWidth="2"/>
              <line x1="17.5" y1="10" x2="17.5" y2="14" stroke="white" strokeWidth="2"/>
              <line x1="10" y1="17.5" x2="14" y2="17.5" stroke="white" strokeWidth="2"/>
            </svg>
          </div>

          <h1 style={{ textAlign: 'center', color: '#0b1220', fontSize: 22, fontWeight: 600, marginTop: 20 }}>Login</h1>
          <p style={{ textAlign: 'center', color: '#374151', fontSize: 13, marginBottom: 18 }}>Enter your phone number and password to continue</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && <div style={{ color: '#b91c1c', background: '#fee2e2', padding: 8, borderRadius: 6, fontSize: 13 }}>{error}</div>}

            <div>
              <label style={{ color: '#0b1220', fontSize: 13 }}>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 00000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                style={{ marginTop: 8, width: '100%', background: '#ffffff', border: '1px solid #e6e9ef', padding: '10px 8px', color: '#0b1220', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ color: '#0b1220', fontSize: 13 }}>Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ marginTop: 8, width: '100%', background: '#ffffff', border: '1px solid #e6e9ef', padding: '10px 8px', color: '#0b1220', borderRadius: 8, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', color: '#374151', fontSize: 13, gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" style={{ accentColor: '#00f0ff' }} />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 700, color: '#000', background: 'linear-gradient(90deg,#00f0ff,#0066ff)', boxShadow: '0 8px 20px rgba(0,136,255,0.18)', border: 'none' }}
            >
              {loading ? 'Processing...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
