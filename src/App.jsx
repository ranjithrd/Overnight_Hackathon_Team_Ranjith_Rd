import React, { useState, useEffect } from 'react';
import LoginPage from './assets/components/LoginPage';
import DashboardPage from './assets/components/DashboardPage';
import DepositPage from './assets/components/DepositPage';
import LoanPage from './assets/components/LoanPage';
import { getCurrentUser } from './services/api';

export default function App() {
  // --- State Management ---
  const [currentPage, setCurrentPage] = useState('login');
  
  // App Data State
  const [totalAssets, setTotalAssets] = useState(15000);
  const [loansGiven, setLoansGiven] = useState(5000);
  const [userPhone, setUserPhone] = useState('');

  // Poll authenticated user every 5s and update app state
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!mounted || !user) return;

        // update phone if available
        if (user.phone_number) setUserPhone(user.phone_number);

        // combine balances if provided by API
        const savings = Number(user.savings_balance ?? 0);
        const shares = Number(user.shares_balance ?? 0);
        const combined = (Number.isFinite(savings) ? savings : 0) + (Number.isFinite(shares) ? shares : 0);
        if (combined) setTotalAssets(combined);

        // update loansGiven if provided
        if (typeof user.loans_given === 'number') setLoansGiven(user.loans_given);
      } catch (err) {
        // silently ignore - keep UI responsive. Console log for debug.
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
  }, []);

  // --- Navigation Helpers ---
  const navigateTo = (page) => setCurrentPage(page);

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

  // --- Main Render ---
  return (
    <div className="font-sans text-slate-800">
      {currentPage === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}
      
      {currentPage === 'dashboard' && (
        <DashboardPage 
          userPhone={userPhone}
          totalAssets={totalAssets}
          loansGiven={loansGiven}
          navigateTo={navigateTo}
        />
      )}
      
      {currentPage === 'deposit' && (
        <DepositPage 
          navigateTo={navigateTo} 
          onDeposit={handleDeposit} 
        />
      )}
      
      {currentPage === 'loan' && (
        <LoanPage 
          navigateTo={navigateTo} 
          onApply={handleApply} 
        />
      )}
    </div>
  );
}
