import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh-token'),
}

export const userAPI = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUser: (id: string) => api.get(`/users/${id}`),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getUserStats: () => api.get('/users/stats'),
}

export const speciesAPI = {
  getSpecies: (params?: any) => api.get('/species', { params }),
  getSpeciesById: (id: string) => api.get(`/species/${id}`),
  createSpecies: (data: any) => api.post('/species', data),
  updateSpecies: (id: string, data: any) => api.put(`/species/${id}`, data),
  deleteSpecies: (id: string) => api.delete(`/species/${id}`),
}

export const zoneAPI = {
  getZones: (params?: any) => api.get('/zones', { params }),
  getZone: (id: string) => api.get(`/zones/${id}`),
  createZone: (data: any) => api.post('/zones', data),
  updateZone: (id: string, data: any) => api.put(`/zones/${id}`, data),
  deleteZone: (id: string) => api.delete(`/zones/${id}`),
  getBeds: (zoneId: string) => api.get(`/zones/${zoneId}/beds`),
  createBed: (zoneId: string, data: any) => api.post(`/zones/${zoneId}/beds`, data),
  updateBed: (zoneId: string, bedId: string, data: any) => 
    api.put(`/zones/${zoneId}/beds/${bedId}`, data),
  deleteBed: (zoneId: string, bedId: string) => 
    api.delete(`/zones/${zoneId}/beds/${bedId}`),
}

export const batchAPI = {
  getBatches: (params?: any) => api.get('/batches', { params }),
  getBatch: (id: string) => api.get(`/batches/${id}`),
  createBatch: (data: any) => api.post('/batches', data),
  updateBatch: (id: string, data: any) => api.put(`/batches/${id}`, data),
  deleteBatch: (id: string) => api.delete(`/batches/${id}`),
  updateStage: (id: string, data: any) => api.put(`/batches/${id}/stage`, data),
  markReady: (id: string) => api.put(`/batches/${id}/ready`),
  getBatchHistory: (id: string) => api.get(`/batches/${id}/history`),
}

export const measurementAPI = {
  getMeasurements: (params?: any) => api.get('/measurements', { params }),
  createMeasurement: (data: any) => api.post('/measurements', data),
  createRangeMeasurement: (data: any) => api.post('/measurements/range', data),
  updateMeasurement: (id: string, data: any) => api.put(`/measurements/${id}`, data),
  deleteMeasurement: (id: string) => api.delete(`/measurements/${id}`),
  getBatchMeasurements: (batchId: string) => api.get(`/measurements/batch/${batchId}`),
  getGrowthRanges: () => api.get('/measurements/ranges'),
}

export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getZoneUtilization: () => api.get('/analytics/zones'),
  getSpeciesDistribution: () => api.get('/analytics/species'),
  getStagePipeline: () => api.get('/analytics/stages'),
  getGrowthTrends: (params?: any) => api.get('/analytics/growth', { params }),
  getReadinessPredictions: () => api.get('/analytics/predictions'),
  exportData: (type: string, params?: any) => 
    api.get(`/analytics/export/${type}`, { params, responseType: 'blob' }),
}
