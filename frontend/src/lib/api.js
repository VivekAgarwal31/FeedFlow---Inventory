import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData)
}

// Company API
export const companyAPI = {
  create: (companyData) => api.post('/company/create', companyData),
  join: (companyCode) => api.post('/company/join', { companyCode }),
  get: () => api.get('/company'),
  update: (companyData) => api.put('/company', companyData),
  delete: () => api.delete('/company')
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLowStock: () => api.get('/dashboard/low-stock')
}

// Warehouse API
export const warehouseAPI = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`)
}

// Sale API
export const saleAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getRevenue: (params) => api.get('/sales/revenue', { params }),
  create: (data) => api.post('/sales', data),
  delete: (id) => api.delete(`/sales/${id}`)
}

// Stock Transaction API
export const stockTransactionAPI = {
  getAll: (params) => api.get('/stock-transactions', { params }),
  getById: (id) => api.get(`/stock-transactions/${id}`)
}

// Supplier API
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`)
}

// Purchase API
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  create: (data) => api.post('/purchases', data),
  delete: (id) => api.delete(`/purchases/${id}`)
}

// Client API
export const clientAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  update: (id, data) => api.put(`/clients/${id}`, data)
}

// Stock Operations API
export const stockAPI = {
  getAll: () => api.get('/stock'),
  create: (data) => api.post('/stock', data),
  delete: (id) => api.delete(`/stock/${id}`),
  stockIn: (data) => api.post('/stock/in', data),
  stockOut: (data) => api.post('/stock/out', data),
  stockMove: (data) => api.post('/stock/move', data),
  stockAdjust: (data) => api.post('/stock/adjust', data)
}



export default api
