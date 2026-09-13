import axios from 'axios';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('🔗 API_URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000,
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
    }

    return Promise.reject(error);
  }
);

export const api = {
  // -------------------------
  // AUTH
  // -------------------------

  async login(identifier: string, password: string) {
    const response = await apiClient.post('/api/auth/login', {
      identifier,
      password,
    });

    return response.data;
  },

  async signup(
    email: string,
    username: string,
    password: string,
    fullName?: string
  ) {
    const response = await apiClient.post('/api/auth/signup', {
      email,
      username,
      password,
      full_name: fullName || null,
    });

    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // -------------------------
  // TRANSCRIPTION
  // -------------------------

  async transcribe(audio: Blob, language: string) {
    const formData = new FormData();

    formData.append('file', audio, 'recording.webm');
    formData.append('language', language);

    const response = await apiClient.post(
      '/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      }
    );

    return response.data;
  },

  // -------------------------
  // TRANSLATION
  // -------------------------

  async translate(
    text: string,
    target: string,
    source: string = 'auto'
  ) {
    const response = await apiClient.post('/translate', {
      text,
      target,
      source,
    });

    return response.data;
  },

  // -------------------------
  // PDF
  // -------------------------

  async exportPDF(
    original: string,
    translated: string,
    source: string,
    target: string
  ) {
    const response = await apiClient.post(
      '/export-pdf',
      {
        original,
        translated,
        source,
        target,
      },
      {
        responseType: 'blob',
        timeout: 120000,
      }
    );

    return response.data;
  },

  // -------------------------
  // LANGUAGES
  // -------------------------

  async getLanguages() {
    const response = await apiClient.get('/languages');
    return response.data;
  },

  // -------------------------
  // HISTORY
  // -------------------------

  async getHistory(
    skip: number = 0,
    limit: number = 50
  ) {
    const response = await apiClient.get('/history', {
      params: {
        skip,
        limit,
      },
    });

    return response.data;
  },

  async clearHistory() {
    const response = await apiClient.delete('/history');
    return response.data;
  },

  // -------------------------
  // USER
  // -------------------------

  async getUserStats() {
    const response = await apiClient.get('/api/user/stats');
    return response.data;
  },

  // -------------------------
  // ADAPTIVE LEARNING
  // -------------------------

  async submitCorrection(
    original: string,
    corrected: string,
    language: string,
    transcriptionId?: number
  ) {
    const response = await apiClient.post(
      '/api/adaptive/correct',
      {
        original,
        corrected,
        language,
        transcription_id: transcriptionId,
      }
    );

    return response.data;
  },

  async getAdaptivePatterns() {
    const response = await apiClient.get(
      '/api/adaptive/patterns'
    );

    return response.data;
  },

  async getLearningStats() {
    const response = await apiClient.get(
      '/api/adaptive/stats'
    );

    return response.data;
  },

  async applyAdaptiveCorrections(
    text: string,
    language: string
  ) {
    const response = await apiClient.post(
      '/api/adaptive/apply',
      {
        text,
        language,
      }
    );

    return response.data;
  },

  async resetLearning() {
    const response = await apiClient.delete(
      '/api/adaptive/reset'
    );

    return response.data;
  },

  // -------------------------
  // HEALTH
  // -------------------------

  async health() {
    const response = await apiClient.get('/health');
    return response.data;
  },
};