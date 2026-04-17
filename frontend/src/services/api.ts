import axios from 'axios';
const API_URL = 'http://localhost:8000';
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});
export const api = {
  // Transcription
  async transcribe(audio: Blob, language: string) {
    const formData = new FormData();
    formData.append('file', audio);
    formData.append('language', language);
  
    const response = await apiClient.post('/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
  // Languages - Try multiple endpoints
  async getLanguages() {
    try {
      const response = await apiClient.get('/languages');
      return response.data;
    } catch (error) {
      // Fallback to /api/languages
      const response = await apiClient.get('/api/languages');
      return response.data;
    }
  },
  // History - Try multiple endpoints
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
  async getAdaptivePatterns() {
    const response = await apiClient.get('/api/adaptive/patterns');
    return response.data;
  },
  
  async getAdaptiveStats() {
    const response = await apiClient.get('/api/adaptive/stats');
    return response.data;
  },
  
  // Health
  async health() {
    const response = await apiClient.get('/health');
    return response.data;
  }
};
