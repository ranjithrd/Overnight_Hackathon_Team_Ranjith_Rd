import { useState, useEffect } from 'react';
import { 
  getAuditSummary, 
  getOutstandingLoans, 
  getAuditTransactions, 
  exportTransactions,
  getBlockchainStatus 
} from '../../services/api';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Download, 
  Shield, 
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';

export default function AuditorDashboard({ userPhone, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [outstandingLoans, setOutstandingLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // summary, loans, transactions
  const [exporting, setExporting] = useState(false);
  
  // Transaction filters
  const [filterType, setFilterType] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, blockchainData] = await Promise.all([
        getAuditSummary(),
        getBlockchainStatus()
      ]);
      setSummary(summaryData);
      setBlockchainStatus(blockchainData);
    } catch (err) {
      setError(err.message || 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const loadOutstandingLoans = async () => {
    try {
      const data = await getOutstandingLoans();
      setOutstandingLoans(data.outstanding_loans || []);
    } catch (err) {
      setError(err.message || 'Failed to load outstanding loans');
    }
  };

  const loadTransactions = async () => {
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterVerified !== '') params.verified_only = filterVerified === 'true';
      
      const data = await getAuditTransactions(params);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    }
  };

  const handleExport = async (format = 'excel') => {
    setExporting(true);
    try {
      const params = { format };
      if (filterType) params.type = filterType;
      
      const response = await exportTransactions(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'loans') loadOutstandingLoans();
    if (activeTab === 'transactions') loadTransactions();
  }, [activeTab, filterType, filterVerified]);

  const getStatusBadge = (status) => {
    const styles = {
      Requested: { bg: '#fef3c7', color: '#92400e', icon: Clock },
      Approved: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
      Rejected: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
      Closed: { bg: '#e5e7eb', color: '#374151', icon: CheckCircle },
    };
    const config = styles[status] || styles.Requested;
    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '12px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: '12px',
        fontWeight: '500',
      }}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(txn => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      txn.user_name?.toLowerCase().includes(search) ||
      txn.user_phone?.toLowerCase().includes(search) ||
      txn.transaction_id?.toLowerCase().includes(search) ||
      txn.reference?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #00f0ff', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>Loading audit data...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>Audit Dashboard</h1>
              <p style={{ color: '#6b7280', margin: 0 }}>Welcome back, {userPhone}</p>
            </div>
            <button onClick={onLogout} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Logout
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Blockchain Status */}
          {blockchainStatus?.blockchain_integrity && (
            <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <Shield size={32} color="#fff" />
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px', margin: '0 0 4px' }}>Blockchain Integrity Verified</p>
                <p style={{ color: '#d1fae5', fontSize: '13px', margin: 0 }}>
                  {blockchainStatus.verified_transactions} of {blockchainStatus.total_transactions} transactions verified ({blockchainStatus.verification_rate?.toFixed(1)}%)
                </p>
              </div>
              <div style={{ textAlign: 'right', color: '#fff' }}>
                <div style={{ fontSize: '13px', opacity: 0.9 }}>Last Block</div>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>#{blockchainStatus.last_block_number}</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
            {['summary', 'loans', 'transactions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 24px',
                  background: activeTab === tab ? '#3b82f6' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#6b7280',
                  border: 'none',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  fontSize: '14px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Financial Summary</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#3b82f6', color: '#fff', padding: '10px', borderRadius: '8px' }}><DollarSign size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Assets</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{summary.total_assets?.toLocaleString('en-IN')}</p>
                </div>

                <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#10b981', color: '#fff', padding: '10px', borderRadius: '8px' }}><CreditCard size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Loans Disbursed</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{summary.total_loans_disbursed?.toLocaleString('en-IN')}</p>
                </div>

                <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#f59e0b', color: '#fff', padding: '10px', borderRadius: '8px' }}><TrendingUp size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Outstanding</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{summary.total_loans_outstanding?.toLocaleString('en-IN')}</p>
                </div>

                <div style={{ background: '#f3e8ff', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#a855f7', color: '#fff', padding: '10px', borderRadius: '8px' }}><Users size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Members</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{summary.total_members}</p>
                </div>

                <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#ef4444', color: '#fff', padding: '10px', borderRadius: '8px' }}><DollarSign size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Profit</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{summary.total_profit?.toLocaleString('en-IN')}</p>
                </div>

                <div style={{ background: '#e0f2fe', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#0ea5e9', color: '#fff', padding: '10px', borderRadius: '8px' }}><TrendingUp size={24} /></div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>Interest Earned</div>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>₹{summary.total_interest_earned?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Outstanding Loans Tab */}
          {activeTab === 'loans' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Outstanding Loans</h2>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{outstandingLoans.length} loans</span>
              </div>
              
              {outstandingLoans.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Loan ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Borrower</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Outstanding</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Rate</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingLoans.map(loan => (
                        <tr key={loan.loan_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#111827' }}>#{loan.loan_id}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{loan.borrower_name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{loan.borrower_phone}</div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: '#111827' }}>₹{loan.amount?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>₹{loan.amount_outstanding?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#111827' }}>{loan.interest_rate}%</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(loan.status)}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {loan.blockchain_verified ? (
                              <CheckCircle size={18} style={{ color: '#10b981' }} />
                            ) : (
                              <XCircle size={18} style={{ color: '#ef4444' }} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                  <p style={{ color: '#6b7280', margin: 0 }}>No outstanding loans</p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Transaction Audit Trail</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', color: '#111827' }}
                  >
                    <option value="">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="loan_disbursement">Loan Disbursements</option>
                    <option value="loan_repayment">Loan Repayments</option>
                  </select>
                  
                  <select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', color: '#111827' }}
                  >
                    <option value="">All Status</option>
                    <option value="true">Verified Only</option>
                    <option value="false">Unverified Only</option>
                  </select>

                  <button
                    onClick={() => handleExport('excel')}
                    disabled={exporting}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: exporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: exporting ? 0.6 : 1,
                    }}
                  >
                    <Download size={16} />
                    {exporting ? 'Exporting...' : 'Export Excel'}
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search by name, phone, transaction ID, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 44px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {filteredTransactions.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>ID</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Type</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>User</th>
                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Amount</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Reference</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map(txn => (
                        <tr key={txn.transaction_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px', fontSize: '13px', color: '#6b7280' }}>{txn.transaction_id}</td>
                          <td style={{ padding: '10px', fontSize: '13px', color: '#111827' }}>
                            {new Date(txn.timestamp).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: txn.transaction_type === 'deposit' ? '#ecfdf5' : txn.transaction_type === 'loan_disbursement' ? '#fef3c7' : '#e0f2fe',
                              color: txn.transaction_type === 'deposit' ? '#065f46' : txn.transaction_type === 'loan_disbursement' ? '#92400e' : '#075985',
                            }}>
                              {txn.transaction_type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{txn.user_name}</div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>{txn.user_phone}</div>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#111827' }}>₹{txn.amount?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px', fontSize: '12px', color: '#6b7280' }}>{txn.reference || '-'}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {txn.blockchain_verified ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                <CheckCircle size={16} style={{ color: '#10b981' }} />
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>Block #{txn.blockchain_block_number}</span>
                              </div>
                            ) : (
                              <XCircle size={16} style={{ color: '#ef4444' }} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px' }}>
                  <FileText size={48} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
                  <p style={{ color: '#6b7280', margin: 0 }}>No transactions found</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
