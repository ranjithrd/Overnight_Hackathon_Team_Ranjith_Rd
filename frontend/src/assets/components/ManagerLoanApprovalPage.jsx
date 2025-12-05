import { useState, useEffect } from 'react';
import { getAllLoans, updateLoanStatus } from '../../services/api';
import { CheckCircle, XCircle, Clock, DollarSign, Calendar, User, FileText, ArrowLeft } from 'lucide-react';

export default function ManagerLoanApprovalPage({ onBack }) {
  const [loans, setLoans] = useState({ requested_loans: [], other_loans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllLoans();
      setLoans(data);
    } catch (err) {
      setError(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (loanId, status) => {
    setProcessing(loanId);
    setError('');
    try {
      await updateLoanStatus(loanId, status);
      await loadLoans(); // Reload to update the list
    } catch (err) {
      setError(err.message || 'Failed to update loan status');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      requested: { bg: '#fef3c7', color: '#92400e', icon: Clock },
      approved: { bg: '#d1fae5', color: '#065f46', icon: CheckCircle },
      rejected: { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
      closed: { bg: '#e5e7eb', color: '#374151', icon: CheckCircle },
    };
    const config = styles[status] || styles.requested;
    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: '13px',
        fontWeight: '500',
      }}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const LoanCard = ({ loan, showActions }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            ₹{loan.amount?.toLocaleString('en-IN')}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Loan #{loan.id}
          </p>
        </div>
        {getStatusBadge(loan.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Borrower</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {loan.borrower_name || 'N/A'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Duration</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {loan.duration_months} months
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Interest Rate</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {loan.interest_rate}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} style={{ color: '#6b7280' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Repay</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              ₹{loan.total_repayment?.toLocaleString('en-IN') || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {loan.reason && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '12px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          marginBottom: showActions ? '16px' : 0,
        }}>
          <FileText size={16} style={{ color: '#6b7280', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Reason</div>
            <div style={{ fontSize: '14px', color: '#111827' }}>{loan.reason}</div>
          </div>
        </div>
      )}

      {showActions && (loan.status === 'requested' || loan.status === 'Requested') && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleStatusUpdate(loan.id, 'Approved')}
            disabled={processing === loan.id}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: processing === loan.id ? 'not-allowed' : 'pointer',
              opacity: processing === loan.id ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={16} />
            {processing === loan.id ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleStatusUpdate(loan.id, 'Rejected')}
            disabled={processing === loan.id}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: processing === loan.id ? 'not-allowed' : 'pointer',
              opacity: processing === loan.id ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <XCircle size={16} />
            {processing === loan.id ? 'Processing...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading loans...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            marginBottom: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h1 style={{ margin: '0 0 24px', fontSize: '28px', fontWeight: '700', color: '#fff' }}>
          Loan Approvals
        </h1>

      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Pending Requests */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '600', color: '#fff' }}>
          Pending Requests
          <span style={{
            marginLeft: '12px',
            padding: '2px 10px',
            borderRadius: '12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            {loans.requested_loans?.length || 0}
          </span>
        </h2>
        {loans.requested_loans?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {loans.requested_loans.map(loan => (
              <LoanCard key={loan.id} loan={loan} showActions={true} />
            ))}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px dashed #d1d5db',
          }}>
            <Clock size={48} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: '#6b7280' }}>No pending loan requests</p>
          </div>
        )}
      </div>

      {/* All Loans */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: '600', color: '#fff' }}>
          All Loans
          <span style={{
            marginLeft: '12px',
            padding: '2px 10px',
            borderRadius: '12px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            {loans.other_loans?.length || 0}
          </span>
        </h2>
        {loans.other_loans?.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {loans.other_loans.map(loan => (
              <LoanCard key={loan.id} loan={loan} showActions={false} />
            ))}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px dashed #d1d5db',
          }}>
            <FileText size={48} style={{ color: '#9ca3af', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: '#6b7280' }}>No loans found</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
