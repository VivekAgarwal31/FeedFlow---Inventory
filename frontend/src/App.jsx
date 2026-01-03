import React, { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useAnalytics } from './hooks/useAnalytics'

// Public pages - keep in main bundle for fast initial load
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsAndConditions from './pages/TermsAndConditions'
import RefundPolicy from './pages/RefundPolicy'
import FeaturesPage from './pages/FeaturesPage'
import InventoryManagement from './pages/InventoryManagement'
import AccountingSoftware from './pages/AccountingSoftware'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import SupportPage from './pages/SupportPage'
import OTPVerification from './pages/OTPVerification'
import BlogIndex from './pages/BlogIndex'
import BlogPost from './pages/BlogPost'

// Dashboard pages - lazy load to reduce initial bundle
const CompanySetupPage = lazy(() => import('./pages/CompanySetupPage'))
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Warehouses = lazy(() => import('./pages/Warehouses'))
const StockList = lazy(() => import('./pages/StockList'))
const StockIn = lazy(() => import('./pages/StockIn'))
const StockOut = lazy(() => import('./pages/StockOut'))
const StockAdjust = lazy(() => import('./pages/StockAdjust'))
const StockMove = lazy(() => import('./pages/StockMove'))
const StockTransactions = lazy(() => import('./pages/StockTransactions'))
const Sales = lazy(() => import('./pages/Sales'))
const Purchases = lazy(() => import('./pages/Purchases'))
const SalesOrders = lazy(() => import('./pages/SalesOrders'))
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'))
const DeliveryOut = lazy(() => import('./pages/DeliveryOut'))
const DeliveryIn = lazy(() => import('./pages/DeliveryIn'))
const DirectSale = lazy(() => import('./pages/DirectSale'))
const DirectPurchase = lazy(() => import('./pages/DirectPurchase'))
const Clients = lazy(() => import('./pages/Clients'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const Staff = lazy(() => import('./pages/Staff'))
const Settings = lazy(() => import('./pages/Settings'))
const Reports = lazy(() => import('./pages/Reports'))
const AccountsReceivable = lazy(() => import('./pages/AccountsReceivable'))
const AccountsPayable = lazy(() => import('./pages/AccountsPayable'))
const EntriesRegister = lazy(() => import('./pages/EntriesRegister'))
const Cashbook = lazy(() => import('./pages/Cashbook'))
const WagesCalculator = lazy(() => import('./pages/WagesCalculator'))
const ManualEntry = lazy(() => import('./pages/ManualEntry'))

// Admin pages - lazy load
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const CompanyManagement = lazy(() => import('./pages/admin/CompanyManagement'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))

function App() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Track page views with Google Analytics (public pages only)
  useAnalytics()

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
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/features/inventory-management" element={<InventoryManagement />} />
        <Route path="/features/accounting-software" element={<AccountingSoftware />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Authenticated but no company
  if (!user.companyId) {
    // Super admins don't need a company - redirect to admin panel
    if (user.role === 'super_admin') {
      return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <Routes>
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      )
    }

    // Regular users need to set up company
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <Routes>
          <Route path="/company-setup" element={<CompanySetupPage />} />
          <Route path="*" element={<Navigate to="/company-setup" replace />} />
        </Routes>
      </Suspense>
    )
  }

  // Authenticated with company
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
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
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/delivery-out" element={<DeliveryOut />} />
          <Route path="/delivery-in" element={<DeliveryIn />} />
          <Route path="/direct-sales" element={<DirectSale />} />
          <Route path="/direct-purchases" element={<DirectPurchase />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/accounts-receivable" element={<AccountsReceivable />} />
          <Route path="/accounts-payable" element={<AccountsPayable />} />
          <Route path="/accounting/entries-register" element={<EntriesRegister />} />
          <Route path="/accounting/cashbook" element={<Cashbook />} />
          <Route path="/accounting/wages" element={<WagesCalculator />} />
          <Route path="/accounting/manual-entry" element={<ManualEntry />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </Suspense>
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
        <Route path="coupons" element={<AdminCoupons />} />
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
