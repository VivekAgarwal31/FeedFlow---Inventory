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
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  requestOTP: (data) => api.post('/auth/request-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data)
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
  getById: (id) => api.get(`/stock-transactions/${id}`),
  delete: (id) => api.delete(`/stock-transactions/${id}`)
}

// Supplier API
export const supplierAPI = {
  getAll: () => api.get('/suppliers'),
  getList: () => api.get('/suppliers/list'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  recalculatePayables: () => api.post('/suppliers/recalculate-payables'),
  bulkImport: (formData) => api.post('/suppliers/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Purchase API
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  create: (data) => api.post('/purchases', data),
  delete: (id) => api.delete(`/purchases/${id}`)
}

// Sales Order API
export const salesOrderAPI = {
  getAll: (params) => api.get('/sales-orders', { params }),
  getById: (id) => api.get(`/sales-orders/${id}`),
  getPendingByClient: (clientId) => api.get(`/sales-orders/pending/${clientId}`),
  create: (data) => api.post('/sales-orders', data),
  update: (id, data) => api.put(`/sales-orders/${id}`, data),
  delete: (id) => api.delete(`/sales-orders/${id}`)
}

// Purchase Order API
export const purchaseOrderAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  getPendingBySupplier: (supplierId) => api.get(`/purchase-orders/pending/${supplierId}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`)
}

// Delivery API
export const deliveryAPI = {
  // Delivery Out (Sales)
  getAllOut: (params) => api.get('/deliveries/out', { params }),
  getOutById: (id) => api.get(`/deliveries/out/${id}`),
  createOut: (data) => api.post('/deliveries/out', data),
  deleteOut: (id) => api.delete(`/deliveries/out/${id}`),

  // Delivery In (Purchase)
  getAllIn: (params) => api.get('/deliveries/in', { params }),
  getInById: (id) => api.get(`/deliveries/in/${id}`),
  createIn: (data) => api.post('/deliveries/in', data),
  deleteIn: (id) => api.delete(`/deliveries/in/${id}`)
}

// Client API
export const clientAPI = {
  getAll: () => api.get('/clients'),
  getList: () => api.get('/clients/list'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  bulkImport: (formData) => api.post('/clients/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
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

// Staff API
export const staffAPI = {
  getAll: () => api.get('/staff'),
  updateRole: (userId, role) => api.put(`/staff/${userId}/role`, { role }),
  updatePermissions: (userId, permissions) => api.put(`/staff/${userId}/permissions`, { permissions }),
  updateStatus: (userId, isActive) => api.put(`/staff/${userId}/status`, { isActive }),
  remove: (userId) => api.delete(`/staff/${userId}`)
}

// Data Management API
export const dataManagementAPI = {
  // Export/Import
  exportData: (entity, format) => api.get(`/data-management/export/${entity}?format=${format}`, { responseType: 'blob' }),
  downloadTemplate: (entity, format = 'excel') => api.get(`/data-management/template/${entity}?format=${format}`, { responseType: 'blob' }),
  importData: (entity, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/data-management/import/${entity}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Backup
  createBackup: () => api.post('/data-management/backup/create'),
  listBackups: () => api.get('/data-management/backup/list'),
  downloadBackup: (backupId) => api.get(`/data-management/backup/download/${backupId}`, { responseType: 'blob' }),
  restoreBackup: (backupId) => api.post('/data-management/backup/restore', { backupId }),
  deleteBackup: (backupId) => api.delete(`/data-management/backup/${backupId}`),

  // Archive
  archiveRecords: (entity, cutoffDate) => api.post('/data-management/archive/create', { entity, cutoffDate }),
  getArchivedRecords: (entity, page = 1, limit = 50) => api.get(`/data-management/archive/${entity}?page=${page}&limit=${limit}`),
  restoreFromArchive: (entity, recordIds) => api.post('/data-management/archive/restore', { entity, recordIds }),
  restoreArchive: (entity, cutoffDate) => api.post('/data-management/archive/restore', { entity, cutoffDate }),
  getArchiveStats: () => api.get('/data-management/archive/stats'),

  // Cleanup
  analyzeCleanup: () => api.get('/data-management/cleanup/analyze'),
  executeCleanup: (dryRun = true) => api.post('/data-management/cleanup/execute', { dryRun }),
  optimizeDatabase: () => api.post('/data-management/cleanup/optimize'),
  getCleanupHistory: () => api.get('/data-management/cleanup/history')
}

// Subscription API
export const subscriptionAPI = {
  getCurrent: () => api.get('/subscription/current'),
  getStatus: () => api.get('/subscription/status'),
  getPlans: () => api.get('/subscription/plans'),
  checkAccess: (feature, companyId) => api.post('/subscription/check-access', { feature, companyId })
}

// Admin Subscription API
export const adminSubscriptionAPI = {
  getAllSubscriptions: (params) => api.get('/admin/subscription/subscriptions', { params }),
  getUserSubscription: (userId) => api.get(`/admin/subscription/subscriptions/${userId}`),
  updateUserPlan: (userId, planType, notes) => api.put(`/admin/subscription/subscriptions/${userId}/plan`, { planType, notes }),
  getStats: () => api.get('/admin/subscription/subscriptions-stats')
}

// Payment API (Razorpay)
export const paymentAPI = {
  createOrder: (planType) => api.post('/subscription-payments/create-order', { planType }),
  verifyPayment: (data) => api.post('/subscription-payments/verify', data),
  validateCoupon: (data) => api.post('/subscription-payments/validate-coupon', data),
  activateFreePlan: (data) => api.post('/subscription-payments/activate-free', data)
}

export default api

