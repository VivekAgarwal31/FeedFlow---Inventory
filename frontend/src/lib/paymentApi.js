import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors (same as api.js)
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Payment APIs
export const recordPayment = async (paymentData) => {
    const response = await api.post('/payments/record', paymentData);
    return response.data;
};

export const getTransactionPayments = async (transactionId, type) => {
    const response = await api.get(`/payments/transaction/${transactionId}?type=${type}`);
    return response.data;
};

export const getPartyPayments = async (partyId, type, page = 1) => {
    const response = await api.get(`/payments/party/${partyId}?type=${type}&page=${page}`);
    return response.data;
};

export const getAllPayments = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/payments/all?${params}`);
    return response.data;
};

export const getClientPayments = async (clientId) => {
    const response = await api.get(`/payments/client/${clientId}`);
    return response.data;
};

export const recordClientPayment = async (paymentData) => {
    const response = await api.post('/payments/record-client-payment', paymentData);
    return response.data;
};

export const deletePayment = async (paymentId) => {
    const response = await api.delete(`/payments/${paymentId}`);
    return response.data;
};

// Invoice APIs
export const generateInvoice = async (saleId, invoiceData = {}) => {
    const response = await api.post(`/invoices/generate/${saleId}`, invoiceData);
    return response.data;
};

export const downloadInvoiceBySale = async (saleId) => {
    const response = await api.get(`/invoices/download-by-sale/${saleId}`, {
        responseType: 'blob'
    });
    return response.data;
};

export const downloadInvoiceByNumber = async (invoiceNumber) => {
    const response = await api.get(`/invoices/download/${invoiceNumber}`, {
        responseType: 'blob'
    });
    return response.data;
};

export const getInvoiceBySale = async (saleId) => {
    const response = await api.get(`/invoices/sale/${saleId}`);
    return response.data;
};

export const getAllInvoices = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/invoices?${params}`);
    return response.data;
};

export const updateInvoiceTerms = async (invoiceId, terms) => {
    const response = await api.put(`/invoices/${invoiceId}/terms`, terms);
    return response.data;
};

// Accounts APIs
export const getAccountsReceivable = async () => {
    const response = await api.get('/accounts/receivable');
    return response.data;
};

export const getReceivableClients = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/accounts/receivable/clients?${params}`);
    return response.data;
};

export const getOutstandingInvoices = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/accounts/receivable/invoices?${params}`);
    return response.data;
};

export const getAccountsPayable = async () => {
    const response = await api.get('/accounts/payable');
    return response.data;
};

export const getPayableSuppliers = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/accounts/payable/suppliers?${params}`);
    return response.data;
};

export const getOutstandingBills = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/accounts/payable/bills?${params}`);
    return response.data;
};

// Client credit management APIs
export const updateClientCreditLimit = async (clientId, creditData) => {
    const response = await api.put(`/clients/${clientId}/credit-limit`, creditData);
    return response.data;
};

export const getClientCreditStatus = async (clientId) => {
    const response = await api.get(`/clients/${clientId}/credit-status`);
    return response.data;
};

export const getClientPaymentHistory = async (clientId) => {
    const response = await api.get(`/clients/${clientId}/payment-history`);
    return response.data;
};

// Helper function to download blob as file
export const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
