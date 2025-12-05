import React, { useState, useEffect } from 'react';
import LoginPage from './assets/components/LoginPage';
import DashboardPage from './assets/components/DashboardPage';
import DepositPage from './assets/components/DepositPage';
import LoanPage from './assets/components/LoanPage';
import ManagerLoanApprovalPage from './assets/components/ManagerLoanApprovalPage';
import ManagerDepositPage from './assets/components/ManagerDepositPage';
import ManagerLoanCreationPage from './assets/components/ManagerLoanCreationPage';
import AuditorDashboard from './assets/components/AuditorDashboard';
import { getCurrentUser } from './services/api';

export default function App() {
  // --- State Management ---
  const [currentPage, setCurrentPage] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // App Data State
  const [totalAssets, setTotalAssets] = useState(15000);
  const [loansGiven, setLoansGiven] = useState(5000);
  const [userPhone, setUserPhone] = useState('');

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to get current user to verify session
        const user = await getCurrentUser();
        if (user) {
          // Valid session exists
          setIsAuthenticated(true);
          if (user.phone_number) setUserPhone(user.phone_number);
          if (user.role) setUserRole(user.role);
          
          // Update data if available
          const savings = Number(user.savings_balance ?? 0);
          const shares = Number(user.shares_balance ?? 0);
          const combined = (Number.isFinite(savings) ? savings : 0) + (Number.isFinite(shares) ? shares : 0);
          if (combined) setTotalAssets(combined);
          if (typeof user.loans_given === 'number') setLoansGiven(user.loans_given);
        } else {
          // No valid session
          setIsAuthenticated(false);
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        // 401 or other error means no valid session
        setIsAuthenticated(false);
        localStorage.removeItem('authToken');
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Poll authenticated user every 5s and update app state
  useEffect(() => {
    // Only fetch user if authenticated and auth has been checked
    if (!isAuthenticated || !authChecked) return;

    let mounted = true;

    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted || !user) return;

        // update phone if available
        if (user.phone_number) setUserPhone(user.phone_number);
        if (user.role) setUserRole(user.role);

        // combine balances if provided by API
        const savings = Number(user.savings_balance ?? 0);
        const shares = Number(user.shares_balance ?? 0);
        const combined = (Number.isFinite(savings) ? savings : 0) + (Number.isFinite(shares) ? shares : 0);
        if (combined) setTotalAssets(combined);

        // update loansGiven if provided
        if (typeof user.loans_given === 'number') setLoansGiven(user.loans_given);
      } catch (err) {
        // Session expired - logout
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem('authToken');
        }
        // eslint-disable-next-line no-console
        console.debug('poll /auth/me failed', err?.message || err);
      }
    };

    // run immediately then every 5s
    fetchUser();
    const id = setInterval(fetchUser, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [isAuthenticated, authChecked]);

  // --- Navigation Helpers ---
  const navigateTo = (page) => setCurrentPage(page);

  // ensure UI redirects to the appropriate page when auth state changes
  useEffect(() => {
    // Don't redirect until auth has been checked
    if (!authChecked) return;
    
    if (isAuthenticated) {
      // Auditors go to auditor dashboard
      if (userRole === 'auditor') {
        navigateTo('auditor-dashboard');
      } else {
        navigateTo('dashboard');
      }
    } else {
      navigateTo('login');
    }
  }, [isAuthenticated, authChecked, userRole]);

  // Logout helper: clear token if present and return to login
  const handleLogout = () => {
    try { localStorage.removeItem('authToken'); } catch (e) {}
    setIsAuthenticated(false);
    setUserPhone('');
    setUserRole(null);
    navigateTo('login');
  };

  // --- Handlers ---
  const handleLogin = (phone) => {
    setUserPhone(phone);
    navigateTo('dashboard');
  };

  const handleDeposit = (amount) => {
    setTotalAssets(prev => prev + amount);
    navigateTo('dashboard');
  };

  const handleApply = (amount) => {
    setLoansGiven(prev => prev + amount);
    navigateTo('dashboard');
  };

  // --- Main Render using switch ---
  const renderPage = () => {
    // Show loading screen while checking authentication
    if (!authChecked) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #000000 0%, #001f3f 50%, #00f0ff 100%)' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #00f0ff', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ fontSize: 18, fontWeight: 600 }}>Loading...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={(phone) => { setIsAuthenticated(true); handleLogin(phone); }} />;

      case 'dashboard':
        return (
          <DashboardPage
            userPhone={userPhone}
            totalAssets={totalAssets}
            loansGiven={loansGiven}
            navigateTo={navigateTo}
            onLogout={handleLogout}
          />
        );

      case 'deposit':
        return (
          <DepositPage
            navigateTo={navigateTo}
            onDeposit={handleDeposit}
          />
        );

      case 'loan':
        return (
          <LoanPage
            navigateTo={navigateTo}
            onApply={handleApply}
          />
        );

      case 'manager-loan-approval':
        return <ManagerLoanApprovalPage onBack={() => navigateTo('dashboard')} />;

      case 'manager-deposit':
        return <ManagerDepositPage onBack={() => navigateTo('dashboard')} />;

      case 'manager-loan-creation':
        return <ManagerLoanCreationPage onBack={() => navigateTo('dashboard')} />;

      case 'auditor-dashboard':
        return <AuditorDashboard onLogout={handleLogout} />;

      default:
        return null;
    }
  };

  return (
    <div className="font-sans text-slate-800">{renderPage()}</div>
  );
}
