import { useState, useEffect } from 'react';
import { getUsers, addDeposit } from '../../services/api';
import { Search, DollarSign, User, FileText, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ManagerDepositPage({ onBack }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const data = await getUsers(searchTerm);
      setUsers(data.users || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Failed to search users:', err);
      setUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.name || user.phone_number);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addDeposit({
        user_id: selectedUser.user_id,
        amount: parseFloat(amount),
        reference: reference || undefined,
      });
      setSuccess(true);
      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setSelectedUser(null);
        setSearchTerm('');
        setAmount('');
        setReference('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to add deposit');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <CheckCircle size={48} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '600', color: '#fff' }}>
          Deposit Added Successfully!
        </h2>
        <p style={{ margin: '0 0 24px', color: '#e5e7eb', fontSize: '16px' }}>
          ₹{parseFloat(amount).toLocaleString('en-IN')} deposited for {selectedUser?.name}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
            Add Deposit
          </h1>
          <p style={{ margin: '0 0 24px', color: '#6b7280' }}>
            Deposit funds to a member's account
          </p>

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

          <form onSubmit={handleSubmit}>
            {/* User Search */}
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
              }}>
                Search Member
              </label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedUser) setSelectedUser(null);
                  }}
                  onFocus={() => {
                    if (users.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search by name or phone..."
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    // Delay to allow click on dropdown
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                />
                {searchLoading && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    Searching...
                  </div>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && users.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}>
                  {users.map(user => (
                    <div
                      key={user.user_id}
                      onClick={() => handleUserSelect(user)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                        {user.name || 'Unnamed User'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {user.phone_number} • ID: {user.user_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <User size={16} style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
                    Selected: {selectedUser.name} ({selectedUser.phone_number})
                  </span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
              }}>
                Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '18px',
                  fontWeight: '500',
                  color: '#6b7280',
                }}>
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 36px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                  }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Reference (Optional) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
              }}>
                Reference (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <FileText
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '12px',
                    color: '#9ca3af',
                  }}
                />
                <textarea
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Add a note or reference..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    fontSize: '16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocusCapture={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlurCapture={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedUser}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: selectedUser && !loading ? '#3b82f6' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: selectedUser && !loading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
            >
              {loading ? 'Processing...' : 'Add Deposit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
