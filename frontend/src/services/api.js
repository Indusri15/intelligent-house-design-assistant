import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/ai';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth APIs
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Project APIs
export const projectApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Floor Plan APIs
export const floorPlanApi = {
  get: (projectId) => api.get(`/floor-plans/${projectId}`),
  generate: (projectId) => api.post(`/floor-plans/generate/${projectId}`),
  select: (projectId, candidateId) => api.post(`/floor-plans/select/${projectId}`, { candidateId }),
  saveRevision: (projectId, notes) => api.post(`/floor-plans/save-revision/${projectId}`, { notes }),
};

// Vastu APIs
export const vastuApi = {
  get: (projectId) => api.get(`/vastu/${projectId}`),
  evaluate: (projectId) => api.post(`/vastu/evaluate/${projectId}`),
};

// Estimation & BOQ APIs
export const estimationApi = {
  get: (projectId) => api.get(`/estimation/${projectId}`),
  recalculate: (projectId, packageTier) => api.post(`/estimation/recalculate/${projectId}`, { packageTier }),
  getPackages: (projectId) => api.get(`/estimation/packages/${projectId}`),
  selectPackage: (projectId, packageTier) => api.post(`/estimation/select-package/${projectId}`, { packageTier }),
  getRates: () => api.get('/estimation/rates'),
};

// Progress APIs
export const progressApi = {
  getStages: (projectId) => api.get(`/progress/${projectId}`),
  updateStage: (projectId, stageId, data) => api.put(`/progress/${projectId}/stages/${stageId}`, data),
  completeStage: (projectId, stageId, notes) => api.post(`/progress/${projectId}/stages/${stageId}/complete`, { notes }),
  recordException: (projectId, stageId, reason) => api.post(`/progress/${projectId}/stages/${stageId}/exception`, { reason }),
};

// Expense APIs
export const expenseApi = {
  getExpenses: (projectId) => api.get(`/expenses/${projectId}`),
  addExpense: (projectId, formData) => api.post(`/expenses/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateExpense: (projectId, expenseId, data) => api.put(`/expenses/${projectId}/${expenseId}`, data),
  deleteExpense: (projectId, expenseId) => api.delete(`/expenses/${projectId}/${expenseId}`),
};

// Design APIs
export const designApi = {
  get: (projectId) => api.get(`/design/${projectId}`),
  update: (projectId, data) => api.put(`/design/${projectId}`, data),
  generateInterior: (projectId, data) => api.post(`/design/generate/interior/${projectId}`, data),
  generateExterior: (projectId, data) => api.post(`/design/generate/exterior/${projectId}`, data),
  getHistory: (projectId, type) => api.get(`/design/history/${projectId}${type ? `?type=${type}` : ''}`),
  toggleFavorite: (designId) => api.put(`/design/favorite/${designId}`),
  selectFinal: (projectId, designId) => api.put(`/design/select-final/${projectId}/${designId}`),
  delete: (designId) => api.delete(`/design/${designId}`),
  analyzeScene: (formData) => api.post('/design/analyze-scene', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProviders: () => api.get('/design/providers'),
};

// Report APIs
export const reportApi = {
  getPdfUrl: (projectId) => `${API_BASE_URL}/reports/${projectId}/pdf`,
  getExcelUrl: (projectId) => `${API_BASE_URL}/reports/${projectId}/excel`,
};

// Chatbot APIs
export const chatbotApi = {
  sendMessage: (payload) => api.post('/chatbot/message', payload),
};

// Admin APIs
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  updateRates: (rates) => api.put('/admin/rates', rates),
};

// Python AI Direct CV API
export const directAiApi = {
  analyzeSiteImage: (formData) => axios.post(`${AI_SERVICE_URL}/analyze-site-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  segmentFloorplan: (formData) => axios.post(`${AI_SERVICE_URL}/segment-floorplan`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;
