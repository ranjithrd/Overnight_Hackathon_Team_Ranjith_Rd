import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler';

// Base API URL - use proxy in dev, full URL in production
const API_BASE = import.meta.env.DEV 
  ? '/api/v1'  // Use Vite proxy in development
  : (import.meta.env.VITE_API_URL || 'https://8mh-api.d.p.ranjithrd.in/api/v1');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // Essential for session cookies
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid - clear auth state
      try {
        localStorage.removeItem('authToken');
        // Could trigger logout here if needed
      } catch (e) {
        // ignore
      }
    }
    return Promise.reject(error);
  }
);

// ---- General ----
export const getApiIndex = asyncHandler(async () => {
  const res = await api.get('/');
  return res.data;
});

export const getHealth = asyncHandler(async () => {
  const res = await api.get('/health');
  return res.data;
});

// ---- Auth ----
// POST /api/v1/auth/login  (login with session cookie)
export const requestOTP = asyncHandler(async (phoneNumber, password) => {
  const res = await api.post('/auth/login', { phone_number: phoneNumber, password });
  // Backend sets session cookie automatically via Set-Cookie header
  // No need to manually store token
  return res.data;
});

// POST /api/v1/auth/verify  (verify OTP and create session)
export const verifyOTP = asyncHandler(async (phoneNumber, otp) => {
  const res = await api.post('/auth/verify', { phoneNumber, otp });
  // Backend sets session cookie automatically via Set-Cookie header
  return res.data;
});

// GET /api/v1/auth/me  (get current user information)
export const getCurrentUser = asyncHandler(async () => {
  const res = await api.get('/auth/me');
  return res.data;
});

// ---- Deposits ----
// POST /api/v1/deposit  (add a deposit - manager)
export const addDeposit = asyncHandler(async (amount, meta = {}) => {
  const payload = { amount, ...meta };
  const res = await api.post('/deposit', payload);
  return res.data;
});

// ---- Home ----
// GET /api/v1/home  (dashboard statistics)
export const getHomeStats = asyncHandler(async () => {
  const res = await api.get('/home');
  return res.data;
});

// ---- Interest Rates ----
// GET /api/v1/interest_rates
export const getInterestRates = asyncHandler(async () => {
  const res = await api.get('/interest_rates');
  return res.data;
});

// POST /api/v1/interest_rates/set  (manager)
export const setInterestRate = asyncHandler(async (durationMonths, ratePercent) => {
  const res = await api.post('/interest_rates/set', { duration: durationMonths, rate: ratePercent });
  return res.data;
});

// ---- Loans ----
// POST /api/v1/loans/add  (manager - add a new loan directly)
export const addLoan = asyncHandler(async (loanData) => {
  const res = await api.post('/loans/add', loanData);
  return res.data;
});

// GET /api/v1/loans/manager  (manager view all loans)
export const getAllLoans = asyncHandler(async () => {
  const res = await api.get('/loans/manager');
  return res.data;
});

// GET /api/v1/loans/member  (get member's loans)
export const getMemberLoans = asyncHandler(async () => {
  const res = await api.get('/loans/member');
  return res.data;
});

// POST /api/v1/loans/request  (request a new loan - member)
export const requestLoan = asyncHandler(async (loanRequest) => {
  const res = await api.post('/loans/request', loanRequest);
  return res.data;
});

// GET /api/v1/loans/{id}  (get loan details by ID)
export const getLoanById = asyncHandler(async (id) => {
  const res = await api.get(`/loans/${encodeURIComponent(id)}`);
  return res.data;
});

// POST /api/v1/loans/{id}/update_status  (approve/reject)
export const updateLoanStatus = asyncHandler(async (id, status) => {
  const res = await api.post(`/loans/${encodeURIComponent(id)}/update_status`, { status });
  return res.data;
});

// ---- Users ----
// GET /api/v1/users  (list/search users)
export const getUsers = asyncHandler(async (search = '') => {
  const params = search ? { search } : {};
  const res = await api.get('/users', { params });
  return res.data;
});

// GET /api/v1/users/{id}  (get user details)
export const getUserById = asyncHandler(async (id) => {
  const res = await api.get(`/users/${encodeURIComponent(id)}`);
  return res.data;
});

// ---- Audit ----
// GET /api/v1/audit/summary  (financial summary)
export const getAuditSummary = asyncHandler(async () => {
  const res = await api.get('/audit/summary');
  return res.data;
});

// GET /api/v1/audit/loans/outstanding  (outstanding loans)
export const getOutstandingLoans = asyncHandler(async (params = {}) => {
  const res = await api.get('/audit/loans/outstanding', { params });
  return res.data;
});

// GET /api/v1/audit/transactions  (all transactions)
export const getAuditTransactions = asyncHandler(async (params = {}) => {
  const res = await api.get('/audit/transactions', { params });
  return res.data;
});

// GET /api/v1/audit/transactions/export  (export to Excel/CSV)
export const exportTransactions = asyncHandler(async (params = {}) => {
  const res = await api.get('/audit/transactions/export', { 
    params,
    responseType: 'blob'  // Important for file downloads
  });
  return res;
});

// GET /api/v1/audit/users/{id}  (user audit report)
export const getUserAuditReport = asyncHandler(async (id) => {
  const res = await api.get(`/audit/users/${encodeURIComponent(id)}`);
  return res.data;
});

// GET /api/v1/audit/blockchain/status  (blockchain verification status)
export const getBlockchainStatus = asyncHandler(async () => {
  const res = await api.get('/audit/blockchain/status');
  return res.data;
});

export default api;
