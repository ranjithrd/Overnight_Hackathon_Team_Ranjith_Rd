import React, { useState } from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { requestLoan } from '../../services/api';

export default function LoanPage({ navigateTo, onApply }) {
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!loanAmount || !duration || !reason) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(loanAmount);
    const durationMonths = parseInt(duration);

    if (amount <= 0) {
      setError('Loan amount must be greater than 0');
      return;
    }

    if (durationMonths < 1 || durationMonths > 360) {
      setError('Duration must be between 1 and 360 months (30 years)');
      return;
    }

    if (reason.trim().length < 4) {
      setError('Reason must be at least 4 characters long');
      return;
    }

    setLoading(true);
    try {
      await requestLoan({
        amount: amount,
        duration: durationMonths,
        reason: reason.trim()
      });
      
      setSuccess(true);
      if (onApply) {
        onApply();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
        <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
          <div style={{ background: '#ffffff', borderRadius: 12, padding: 40, boxShadow: '0 12px 30px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <CheckCircle size={64} color="#10b981" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0b1220', marginBottom: 12 }}>Loan Request Submitted!</h1>
            <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 15 }}>Your loan application has been submitted successfully and is pending approval.</p>
            <button 
              onClick={() => navigateTo('dashboard')}
              style={{ 
                width: '100%',
                padding: '12px 14px', 
                borderRadius: 8, 
                fontWeight: 700, 
                border: 'none',
                background: '#0b1220',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0 12px 30px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)' }}>
          <button onClick={() => navigateTo('dashboard')} disabled={loading} style={{ marginBottom: 12, background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChevronLeft size={20} /> Back to Dashboard
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1220', marginBottom: 6 }}>Apply For Loan</h1>
          <p style={{ color: '#6b7280', marginBottom: 12 }}>Create a loan request for approval.</p>

          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8 }}>
            {error && (
              <div style={{ marginBottom: 12, padding: 12, background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6 }}>Reason for Loan</label>
                <textarea
                  placeholder="Business expansion, house repair, education, etc."
                  rows="3"
                  minLength="4"
                  style={{ width: '100%', padding: 12, border: '1px solid #e6e9ef', borderRadius: 8, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  required
                />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Minimum 4 characters</p>
              </div>

              <div>
                <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6 }}>Total Amount Needed</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    placeholder="10000"
                    min="1"
                    step="1"
                    style={{ width: '100%', paddingLeft: 28, paddingRight: 12, paddingTop: 12, paddingBottom: 12, border: '1px solid #e6e9ef', borderRadius: 8, boxSizing: 'border-box' }}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6 }}>Duration (Months)</label>
                <input
                  type="number"
                  placeholder="12"
                  min="1"
                  max="360"
                  step="1"
                  style={{ width: '100%', padding: 12, border: '1px solid #e6e9ef', borderRadius: 8, boxSizing: 'border-box' }}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={loading}
                  required
                />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Between 1 and 360 months (30 years)</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  marginTop: 6, 
                  background: loading ? '#9ca3af' : '#0b1220', 
                  color: '#fff', 
                  padding: '12px 14px', 
                  borderRadius: 8, 
                  fontWeight: 700, 
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Apply for Loan'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
