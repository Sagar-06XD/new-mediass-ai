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
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resetChatSession = () => {
  activeSessionId = createSessionId();
  return activeSessionId;
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
    userId: 'demo-user',
    sessionId: activeSessionId
  });
  return response.data;
};

export const checkHealthAPI = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
