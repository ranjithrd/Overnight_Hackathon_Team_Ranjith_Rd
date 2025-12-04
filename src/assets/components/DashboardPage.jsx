import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, FileText, DollarSign } from 'lucide-react';
import { getHomeStats } from '../../services/api';

export default function DashboardPage({ userPhone, totalAssets, loansGiven, navigateTo }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getHomeStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  const displayAssets = stats?.totalAssets || totalAssets;
  const displayLoans = stats?.totalLoans || loansGiven;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, {userPhone}</p>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        <button onClick={() => navigateTo('login')} className="text-sm text-red-500 hover:underline">
          Logout
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 text-sm font-semibold text-slate-600 uppercase tracking-wide">
          <span>Loan Application</span>
          <span>Interest</span>
          <span>Description</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Total Assets Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo('deposit')}>
              <div className="bg-blue-500 text-white p-4 rounded-full mb-4 shadow-blue-200 shadow-lg">
                <Wallet size={32} />
              </div>
              <h3 className="text-slate-500 font-medium mb-2">Total Assets</h3>
              <p className="text-4xl font-bold text-slate-800">${displayAssets.toLocaleString()}</p>
              <span className="text-blue-600 text-sm mt-4 font-medium px-4 py-1 bg-blue-100 rounded-full">Tap to Deposit</span>
            </div>

            {/* Loans Given Card */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigateTo('loan')}>
              <div className="bg-emerald-500 text-white p-4 rounded-full mb-4 shadow-emerald-200 shadow-lg">
                <CreditCard size={32} />
              </div>
              <h3 className="text-slate-500 font-medium mb-2">Loans Given</h3>
              <p className="text-4xl font-bold text-slate-800">${displayLoans.toLocaleString()}</p>
              <span className="text-emerald-600 text-sm mt-4 font-medium px-4 py-1 bg-emerald-100 rounded-full">Tap to Apply for Loan</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigateTo('loan')}
          className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 font-medium"
        >
          <FileText size={20} /> New Application
        </button>
        <button 
           onClick={() => navigateTo('deposit')}
          className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 font-medium"
        >
          <DollarSign size={20} /> Add Funds
        </button>
      </div>
    </div>
  );
}