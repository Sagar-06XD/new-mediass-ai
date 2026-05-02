import axios from 'axios';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `session_${crypto.randomUUID()}`;
  }
  return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

let activeSessionId = createSessionId();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const resetChatSession = () => {
  activeSessionId = createSessionId();
  return activeSessionId;
};

export const getChatSessionId = () => activeSessionId;

/** Restore backend chat context when reopening a saved consultation */
export const setChatSessionId = (sessionId) => {
  if (typeof sessionId === 'string' && sessionId.startsWith('session_')) {
    activeSessionId = sessionId;
  }
};

export const uploadFileAPI = async (file) => {
  const formData = new FormData();
  formData.append('files', file);
  const response = await api.post('/api/train/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const trainModelAPI = async () => {
  const response = await api.post('/api/train/process');
  return response.data;
};

export const trainTextAPI = async (text) => {
  const response = await api.post('/api/train/text', { text });
  return response.data;
};

export const queryModelAPI = async (question) => {
  const response = await api.post('/api/chat', {
    message: question,
    sessionId: activeSessionId
  });
  return response.data;
};

export const checkHealthAPI = async () => {
  const response = await api.get('/health');
  return response.data;
};

/** Authenticated — returns corpusChunks and is_trained for the logged-in account */
export const fetchTrainingStatusAPI = async () => {
  const response = await api.get('/api/train/status');
  return response.data;
};

export const loginAPI = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const signupAPI = async (email, password) => {
  const response = await api.post('/api/auth/signup', { email, password });
  return response.data;
};

export const forgotPasswordAPI = async (email, newPassword) => {
  const response = await api.post('/api/auth/forgot-password', { email, newPassword });
  return response.data;
};

export default api;
