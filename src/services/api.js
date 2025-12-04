import axios from 'axios';
import { asyncHandler } from '../utils/asyncHandler';

// Base API URL - prefer Vite env var if present
const API_BASE = import.meta.env.VITE_API_URL || 'http://8mh-api.d.p.ranjithrd.in/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

// Attach token automatically when present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }
  return config;
});

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
// POST /api/v1/auth/login  (request OTP for phone number)
export const requestOTP = asyncHandler(async (phoneNumber) => {
  const res = await api.post('/auth/login', { phoneNumber });
  return res.data;
});

// POST /api/v1/auth/verify  (verify OTP and create session)
export const verifyOTP = asyncHandler(async (phoneNumber, otp) => {
  const res = await api.post('/auth/verify', { phoneNumber, otp });
  // store token if returned
  if (res?.data?.token) {
    try { localStorage.setItem('authToken', res.data.token); } catch (e) {}
  }
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

export default api;
