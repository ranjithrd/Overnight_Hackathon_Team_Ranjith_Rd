import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { requestLoan } from '../../services/api';

export default function LoanPage({ navigateTo, onApply }) {
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loanAmount) {
      setError('Please enter a loan amount');
      return;
    }
    if (!duration) {
      setError('Please enter a duration');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const loanRequest = {
        amount: parseFloat(loanAmount),
        durationMonths: parseInt(duration),
        reason: reason || 'General purpose loan'
      };
      const result = await requestLoan(loanRequest);
      onApply(parseFloat(loanAmount));
      navigateTo('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit loan request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
       <div className="w-full max-w-md">
          <button 
            onClick={() => navigateTo('dashboard')} 
            className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Loan Application</h1>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 relative">
             {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

             <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div>
                <label className="block text-slate-600 font-medium mb-2">Total Amount Needed</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="10000"
                    className="w-full pl-8 p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-800 disabled:opacity-50"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-2">Duration (Months)</label>
                <input 
                  type="number" 
                  placeholder="12"
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-2">Reason</label>
                <textarea 
                  placeholder="Business expansion..."
                  rows="3"
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none disabled:opacity-50"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-4 bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Apply Now'}
              </button>
            </form>
          </div>
       </div>
    </div>
  );
}
