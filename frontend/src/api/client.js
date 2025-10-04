import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加session ID到所有请求
apiClient.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
  
  checkStatus: async () => {
    const response = await apiClient.get('/auth/status');
    return response.data;
  }
};

export const gmailApi = {
  setupLabels: async () => {
    const response = await apiClient.post('/api/gmail/setup');
    return response.data;
  },
  
  scanEmails: async (options = {}) => {
    const response = await apiClient.post('/api/gmail/scan', options);
    return response.data;
  },
  
  getLabels: async () => {
    const response = await apiClient.get('/api/gmail/labels');
    return response.data;
  }
};

export default apiClient;