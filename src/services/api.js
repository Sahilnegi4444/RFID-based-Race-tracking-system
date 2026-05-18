/**
 * Mock API service for future FastAPI integration.
 * Currently uses mock data, but structure is ready for Axios/Fetch calls.
 */

const BASE_URL = 'http://localhost:8000/api/v1';

export const api = {
  // Auth
  login: async (credentials) => {
    // return axios.post(`${BASE_URL}/auth/login`, credentials);
    return Promise.resolve({ data: { token: 'mock-jwt-token' } });
  },

  // Runners
  getRunners: async () => {
    // return axios.get(`${BASE_URL}/runners`);
    return Promise.resolve({ data: [] });
  },
  
  uploadRunners: async (runnersData) => {
    // return axios.post(`${BASE_URL}/runners/bulk`, runnersData);
    return Promise.resolve({ data: { success: true } });
  },

  // Settings
  getSettings: async () => {
    // return axios.get(`${BASE_URL}/settings`);
    return Promise.resolve({ data: {} });
  },

  updateSettings: async (settings) => {
    // return axios.put(`${BASE_URL}/settings`, settings);
    return Promise.resolve({ data: settings });
  }
};
