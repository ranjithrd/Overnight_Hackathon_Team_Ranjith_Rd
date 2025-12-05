import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { addDeposit } from '../../services/api';

export default function DepositPage({ navigateTo, onDeposit }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) {
      setError('Please enter an amount');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const result = await addDeposit(parseFloat(amount));
      onDeposit(parseFloat(amount));
      navigateTo('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0 12px 30px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)' }}>
          <button onClick={() => navigateTo('dashboard')} disabled={loading} style={{ marginBottom: 12, background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChevronLeft size={20} /> Back to Dashboard
          </button>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0b1220', marginBottom: 6 }}>Depositing</h1>
          <p style={{ color: '#6b7280', marginBottom: 12 }}>Add funds to your main balance.</p>

          <div style={{ background: '#ffffff', padding: 16, borderRadius: 8 }}>
            {error && (
              <div style={{ marginBottom: 12, padding: 12, background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6 }}>Amount Depositing</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontWeight: 700, fontSize: 16 }}>₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 12, paddingBottom: 12, border: '1px solid #e6e9ef', borderRadius: 8, fontSize: 16, fontWeight: 600, color: '#0b1220', boxSizing: 'border-box' }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, color: '#1e3a8a' }}>
                Confirm that you want to add this deposit to your asset account immediately.
              </div>

              <button type="submit" disabled={loading} style={{ marginTop: 6, background: '#0b1220', color: '#fff', padding: '12px 14px', borderRadius: 8, fontWeight: 700, border: 'none' }}>
                {loading ? 'Processing...' : 'Submit Deposit'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
