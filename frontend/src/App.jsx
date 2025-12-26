import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import CompanySetupPage from './pages/CompanySetupPage'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Warehouses from './pages/Warehouses'
import StockList from './pages/StockList'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import StockAdjust from './pages/StockAdjust'
import StockMove from './pages/StockMove'
import StockTransactions from './pages/StockTransactions'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Clients from './pages/Clients'
import Suppliers from './pages/Suppliers'
import Staff from './pages/Staff'
import Settings from './pages/Settings'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import CompanyManagement from './pages/admin/CompanyManagement'
import UserManagement from './pages/admin/UserManagement'
import OTPVerification from './pages/OTPVerification'
import Reports from './pages/Reports'
import AccountsReceivable from './pages/AccountsReceivable'
import AccountsPayable from './pages/AccountsPayable'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  // Authenticated but no company
  if (!user.companyId) {
    // Super admins don't need a company - redirect to admin panel
    if (user.role === 'super_admin') {
      return (
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      )
    }

    // Regular users need to set up company
    return (
      <Routes>
        <Route path="/company-setup" element={<CompanySetupPage />} />
        <Route path="*" element={<Navigate to="/company-setup" replace />} />
      </Routes>
    )
  }

  // Authenticated with company
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/warehouses" element={<Warehouses />} />
        <Route path="/stock" element={<StockList />} />
        <Route path="/stock-in" element={<StockIn />} />
        <Route path="/stock-out" element={<StockOut />} />
        <Route path="/stock-adjust" element={<StockAdjust />} />
        <Route path="/stock-move" element={<StockMove />} />
        <Route path="/stock-transactions" element={<StockTransactions />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/accounts-receivable" element={<AccountsReceivable />} />
        <Route path="/accounts-payable" element={<AccountsPayable />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

// Admin routes (outside main app, accessible to super_admin only)
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="users" element={<UserManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

function AppWrapper() {
  const { user } = useAuth()

  // Super admin users should always go to admin panel
  if (user && user.role === 'super_admin') {
    return <AdminRoutes />
  }

  // Check if accessing admin routes
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminRoutes />
  }

  return <App />
}

export default AppWrapper
