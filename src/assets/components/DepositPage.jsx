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
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
       <div className="w-full max-w-md">
          <button 
            onClick={() => navigateTo('dashboard')} 
            className="mb-6 flex items-center text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            <ChevronLeft size={20} /> Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Depositing</h1>
          <p className="text-slate-500 mb-8">Add funds to your main balance.</p>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 relative">
             {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

             <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-slate-600 font-medium mb-2">Amount Depositing</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-8 p-4 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold text-slate-800 disabled:opacity-50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-sm">
                 Confirm that you want to add this deposit to your asset account immediately.
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-2 bg-slate-900 text-white font-bold py-4 rounded-lg hover:bg-slate-800 transition-colors shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Submit Deposit'}
              </button>
            </form>
          </div>
       </div>
    </div>
  );
}
