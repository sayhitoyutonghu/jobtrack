import axios from 'axios';

// Temporarily use Railway backend for both dev and prod (until local OAuth is configured)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jobtrack-production.up.railway.app';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      localStorage.removeItem('session_id');
      // Don't auto-reload to prevent infinite loop
      // Let the component handle the authentication state
    }
    return Promise.reject(error);
  }
);

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
    // Always use Railway backend for OAuth (configured in Google Cloud Console)
    window.location.href = "https://jobtrack-production.up.railway.app/auth/google";
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

  createLabel: async (labelData) => {
    const response = await apiClient.post('/api/gmail/create-label', labelData);
    return response.data;
  },

  analyzeEmail: async (emailContent) => {
    const response = await apiClient.post('/api/gmail/analyze-email', { emailContent });
    return response.data;
  },

  scanEmails: async (options = {}) => {
    const response = await apiClient.post('/api/gmail/scan', options);
    return response.data;
  },

  getLabels: async () => {
    const response = await apiClient.get('/api/labels');
    return response.data;
  },

  getAutoScanStatus: async () => {
    const response = await apiClient.get('/api/gmail/auto-scan/status');
    return response.data;
  },

  startAutoScan: async (options = {}) => {
    const response = await apiClient.post('/api/gmail/auto-scan/start', options);
    return response.data;
  },

  stopAutoScan: async () => {
    const response = await apiClient.post('/api/gmail/auto-scan/stop');
    return response.data;
  },

  runNowAutoScan: async (options = {}) => {
    const response = await apiClient.post('/api/gmail/auto-scan/run-now', options);
    return response.data;
  },

  getAutoScanHistory: async () => {
    const response = await apiClient.get('/api/gmail/auto-scan/history');
    return response.data;
  },

  getAllAutoScanSessions: async () => {
    const response = await apiClient.get('/api/gmail/auto-scan/sessions');
    return response.data;
  },

  // 自动管理器API
  getAutoManagerStatus: async () => {
    const response = await apiClient.get('/api/auto-manager/status');
    return response.data;
  },

  startAutoManager: async () => {
    const response = await apiClient.post('/api/auto-manager/start');
    return response.data;
  },

  stopAutoManager: async () => {
    const response = await apiClient.post('/api/auto-manager/stop');
    return response.data;
  },

  setAutoStart: async (enabled) => {
    const response = await apiClient.post(`/api/auto-manager/auto-start/${enabled}`);
    return response.data;
  },

  // Labels API
  removeLabelFromGmail: async (labelId, maxResults = 100) => {
    const response = await apiClient.post(`/api/labels/${labelId}/remove-from-gmail`, { maxResults });
    return response.data;
  },

  deleteLabelFromGmail: async (labelId) => {
    const response = await apiClient.delete(`/api/labels/${labelId}/delete-from-gmail`);
    return response.data;
  },

  toggleLabel: async (labelId, enabled) => {
    const response = await apiClient.put(`/api/labels/${labelId}/toggle`, { enabled });
    return response.data;
  }
};

export const jobsApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/jobs');
    return response.data;
  },

  update: async (jobId, updates) => {
    const response = await apiClient.patch(`/api/jobs/${jobId}`, updates);
    return response.data;
  },

  delete: async (jobId) => {
    const response = await apiClient.delete(`/api/jobs/${jobId}`);
    return response.data;
  }
};

export default apiClient;