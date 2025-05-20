import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => {
    localStorage.removeItem('token');
  },
};

export const accountService = {
  getAccounts: () => api.get('/accounts/'),
  createAccount: (accountData) => api.post('/accounts/', accountData),
  updateAccount: (id, accountData) => api.put(`/accounts/${id}/`, accountData),
  deleteAccount: (id) => api.delete(`/accounts/${id}/`),
};

export const transactionService = {
  getTransactions: () => api.get('/transactions/'),
  createTransaction: (transactionData) => api.post('/transactions/', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/transactions/${id}/`, transactionData),
  deleteTransaction: (id) => api.delete(`/transactions/${id}/`),
};

export default api; 