import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, FileText, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { getHomeStats, getMemberLoans } from '../../services/api';

export default function DashboardPage({ userPhone, totalAssets, loansGiven, navigateTo, onLogout }) {
  const [stats, setStats] = useState(null);
  const [memberLoans, setMemberLoans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getHomeStats();
        setStats(data);
        
        // Fetch member loans if user is a member
        if (data?.role === 'member') {
          setLoansLoading(true);
          try {
            const loansData = await getMemberLoans();
            setMemberLoans(loansData);
          } catch (err) {
            console.error('Error fetching member loans:', err);
          } finally {
            setLoansLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  
  const displayAssets = stats?.total_assets ?? totalAssets;
  const displayLoans = stats?.total_loans ?? loansGiven;
  const totalProfit = stats?.total_profit ?? 0;
  const dividendExpected = stats?.dividend_expected ?? 0;
  const role = stats?.role ?? 'member';
  const blockchainIntegrity = stats?.blockchain_integrity ?? false;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(135deg,#000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
      <div style={{ width: '100%', maxWidth: 980, margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: 12, padding: 20, boxShadow: '0 12px 30px rgba(2,6,23,0.12)', border: '1px solid rgba(2,6,23,0.06)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0b1220' }}>Dashboard</h1>
              <p style={{ color: '#6b7280' }}>Welcome back, {userPhone}</p>
              {error && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 6 }}>{error}</p>}
            </div>
            <button onClick={onLogout} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
          </header>

          {/* Blockchain Integrity Badge */}
          {blockchainIntegrity && (
            <div style={{ marginBottom: 16, padding: 12, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <Shield size={24} color="#fff" />
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>Blockchain Integrity Verified</p>
                <p style={{ color: '#d1fae5', fontSize: 12, margin: 0 }}>All transactions are secured on the blockchain</p>
              </div>
            </div>
          )}

          <div style={{ padding: 16, borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Loading dashboard...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: '#eef2ff', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ background: '#3b82f6', color: '#fff', padding: 10, borderRadius: '999px', marginBottom: 10 }}><Wallet size={28} /></div>
                    <h3 style={{ color: '#6b7280', marginBottom: 6, fontSize: 13 }}>Total Assets</h3>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#0b1220' }}>₹{displayAssets.toLocaleString()}</p>
                  </div>

                  <div onClick={role === 'member' ? () => navigateTo('loan') : undefined} style={{ background: '#ecfdf5', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', cursor: role === 'member' ? 'pointer' : 'default' }}>
                    <div style={{ background: '#10b981', color: '#fff', padding: 10, borderRadius: '999px', marginBottom: 10 }}><CreditCard size={28} /></div>
                    <h3 style={{ color: '#6b7280', marginBottom: 6, fontSize: 13 }}>Total Loans</h3>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#0b1220' }}>₹{displayLoans.toLocaleString()}</p>
                    {role === 'member' && <span style={{ color: '#059669', fontSize: 10, marginTop: 8, padding: '4px 10px', background: '#d1fae5', borderRadius: 999 }}>Tap to Apply</span>}
                  </div>

                  <div style={{ background: '#fef3c7', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ background: '#f59e0b', color: '#fff', padding: 10, borderRadius: '999px', marginBottom: 10 }}><TrendingUp size={28} /></div>
                    <h3 style={{ color: '#6b7280', marginBottom: 6, fontSize: 13 }}>Total Profit</h3>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#0b1220' }}>₹{totalProfit.toLocaleString()}</p>
                  </div>

                  {role === 'member' && (
                    <div style={{ background: '#f3e8ff', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <div style={{ background: '#a855f7', color: '#fff', padding: 10, borderRadius: '999px', marginBottom: 10 }}><DollarSign size={28} /></div>
                      <h3 style={{ color: '#6b7280', marginBottom: 6, fontSize: 13 }}>Dividend Expected</h3>
                      <p style={{ fontSize: 22, fontWeight: 700, color: '#0b1220' }}>₹{dividendExpected.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Member Loans Section */}
                {role === 'member' && memberLoans && (
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0b1220', marginBottom: 16 }}>My Loans</h3>
                    {loansLoading ? (
                      <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading loans...</div>
                    ) : memberLoans.loans && memberLoans.loans.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                        {memberLoans.loans.map((loan) => (
                          <div key={loan.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#0b1220', marginBottom: 4 }}>Loan #{loan.id}</p>
                                <p style={{ fontSize: 12, color: '#6b7280' }}>{loan.reason || 'No reason provided'}</p>
                              </div>
                              <span style={{ 
                                fontSize: 11, 
                                padding: '4px 8px', 
                                borderRadius: 999, 
                                fontWeight: 600,
                                background: loan.status === 'Approved' ? '#d1fae5' : loan.status === 'Rejected' ? '#fee2e2' : loan.status === 'Requested' ? '#fef3c7' : '#f3f4f6',
                                color: loan.status === 'Approved' ? '#16a34a' : loan.status === 'Rejected' ? '#dc2626' : loan.status === 'Requested' ? '#d97706' : '#6b7280'
                              }}>
                                {loan.status}
                              </span>
                            </div>
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Amount</p>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#0b1220' }}>₹{loan.amount?.toLocaleString()}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Duration</p>
                                <p style={{ fontSize: 16, fontWeight: 700, color: '#0b1220' }}>{loan.duration} months</p>
                              </div>
                              {loan.interest_rate && (
                                <div>
                                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Interest Rate</p>
                                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0b1220' }}>{loan.interest_rate}%</p>
                                </div>
                              )}
                              {loan.principal && (
                                <div>
                                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Principal</p>
                                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0b1220' }}>₹{loan.principal?.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                            {loan.created_at && (
                              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
                                Created: {new Date(loan.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 32, background: '#f9fafb', borderRadius: 8, border: '1px dashed #d1d5db' }}>
                        <p style={{ color: '#6b7280', marginBottom: 12 }}>No loans yet</p>
                        <button 
                          onClick={() => navigateTo('loan')}
                          style={{ padding: '8px 16px', background: '#0b1220', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                        >
                          Apply for a Loan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {role === 'manager' ? (
              <>
                <button onClick={() => navigateTo('manager-loan-approval')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  <FileText size={18} />
                  Approve Loans
                </button>
                <button onClick={() => navigateTo('manager-deposit')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  <Wallet size={18} />
                  Add Deposit
                </button>
                <button onClick={() => navigateTo('manager-loan-creation')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  <CreditCard size={18} />
                  Create Loan
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigateTo('loan')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#fff', border: '1px solid #e6e9ef', borderRadius: 8, cursor: 'pointer' }}>
                  <FileText size={18} />
                  New Application
                </button>
                <button onClick={() => navigateTo('deposit')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: '#fff', border: '1px solid #e6e9ef', borderRadius: 8, cursor: 'pointer' }}>
                  <Wallet size={18} />
                  Add Funds
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}