import axios from 'axios';

// ✅ Use environment variable for production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('🔗 API_URL:', API_URL);  // For debugging
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,  // Increased for Render
});
// ✅ Add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Transcription
  async transcribe(audio: Blob, language: string) {
    const formData = new FormData();
    formData.append('file', audio);
    formData.append('language', language);
  
    const response = await apiClient.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,  // Longer timeout for transcription
    });
    return response.data;
  },
  
  // Translation
  async translate(text: string, target: string, source: string = 'auto') {
    const response = await apiClient.post('/translate', {
      text,
      target,
      source
    });
    return response.data;
  },
  
  // PDF Export
  async exportPDF(original: string, translated: string, source: string, target: string) {
    const response = await apiClient.post('/export-pdf', {
      original,
      translated,
      source,
      target
    }, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  // Languages
  async getLanguages() {
    try {
      const response = await apiClient.get('/languages');
      return response.data;
    } catch (error) {
      const response = await apiClient.get('/api/languages');
      return response.data;
    }
  },
  
  // History
  async getHistory(skip: number = 0, limit: number = 50) {
    try {
      const response = await apiClient.get('/history');
      return response.data;
    } catch (error) {
      const response = await apiClient.get('/api/history');
      return response.data;
    }
  },
  
  async clearHistory() {
    try {
      const response = await apiClient.delete('/history');
      return response.data;
    } catch (error) {
      const response = await apiClient.delete('/api/history');
      return response.data;
    }
  },
  
  // User Stats
  async getUserStats() {
    const response = await apiClient.get('/api/user/stats');
    return response.data;
  },
  
  // Adaptive Learning
  async submitCorrection(original: string, corrected: string, language: string, transcriptionId?: number) {
    const response = await apiClient.post('/api/adaptive/correct', {
      original,
      corrected,
      language,
      transcription_id: transcriptionId
    });
    return response.data;
  },
  
  async getAdaptivePatterns() {
    const response = await apiClient.get('/api/adaptive/patterns');
    return response.data;
  },
  
  async getLearningStats() {
    const response = await apiClient.get('/api/adaptive/stats');
    return response.data;
  },
  
  // Auth (if needed)
  async login(username: string, password: string) {
    const response = await apiClient.post('/api/auth/login', { username, password });
    return response.data;
  },
  
  async signup(email: string, username: string, password: string, fullName?: string) {
    const response = await apiClient.post('/api/auth/signup', {
      email,
      username,
      password,
      full_name: fullName
    });
    return response.data;
  },
  
  // Health
  async health() {
    const response = await apiClient.get('/health');
    return response.data;
  }
};
