import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Admin API endpoints
export const adminAPI = {
    // Company Management
    getCompanies: (params) => api.get('/admin/companies', { params }),
    getCompany: (id) => api.get(`/admin/companies/${id}`),
    createCompany: (data) => api.post('/admin/companies', data),
    updateCompany: (id, data) => api.put(`/admin/companies/${id}`, data),
    updateCompanyStatus: (id, status) => api.put(`/admin/companies/${id}/status`, { status }),
    deleteCompany: (id) => api.delete(`/admin/companies/${id}`),

    // User Management
    getUsers: (params) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    createUser: (data) => api.post('/admin/users', data),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
    resetUserPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),

    // Analytics
    getOverview: () => api.get('/admin/analytics/overview'),

    // System Settings
    getSystemSettings: () => api.get('/admin/settings'),
    updateSystemSettings: (data) => api.put('/admin/settings', data)
};
