import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Warehouse,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { companyAPI, dashboardAPI, subscriptionAPI } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import PlanBadge from '../components/PlanBadge'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalStockValue: 0,
    totalQuantity: 0,
    warehouseCount: 0,
    totalRevenue: 0,
    totalSales: 0,
    lowStockCount: 0,
    totalReceivables: 0,
    totalPayables: 0
  })
  const [company, setCompany] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch stats and company data in parallel
        const [statsResponse, companyResponse, subscriptionResponse] = await Promise.all([
          dashboardAPI.getStats(),
          companyAPI.get(),
          subscriptionAPI.getStatus().catch(() => ({ data: { status: null } }))
        ])

        setStats(statsResponse.data.stats)
        setCompany(companyResponse.data.company)
        // API returns subscription status directly in data, not nested
        setSubscription(subscriptionResponse.data)
        console.log('Subscription data:', subscriptionResponse.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchData, 30000)

    // Refresh when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header with Company Name and Plan Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {company?.name || 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
        </div>
        {subscription && (
          <PlanBadge
            planType={subscription.planType}
            planName={subscription.planName}
          />
        )}
      </div>

      {/* Trial Countdown Alert */}
      {subscription?.isTrial && subscription?.daysRemaining !== undefined && (
        <Alert className={subscription.daysRemaining <= 3 ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
          <Clock className={`h-4 w-4 ${subscription.daysRemaining <= 3 ? 'text-red-600' : 'text-blue-600'}`} />
          <AlertTitle className={subscription.daysRemaining <= 3 ? 'text-red-900' : 'text-blue-900'}>
            {subscription.daysRemaining > 0
              ? `Trial ends in ${subscription.daysRemaining} day${subscription.daysRemaining !== 1 ? 's' : ''}`
              : 'Trial has ended'
            }
          </AlertTitle>
          <AlertDescription className={subscription.daysRemaining <= 3 ? 'text-red-700' : 'text-blue-700'}>
            {subscription.daysRemaining > 0
              ? `Upgrade now to continue enjoying unlimited access to all features.`
              : 'Your account has been downgraded to the Free plan. Upgrade to regain full access.'
            }
            <Button
              onClick={() => navigate('/checkout?plan=paid')}
              size="sm"
              className="ml-4"
              variant={subscription.daysRemaining <= 3 ? 'destructive' : 'default'}
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Low Stock Alert */}
      {stats.lowStockCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            You have {stats.lowStockCount} item(s) running low on stock. Check your inventory to reorder.
          </AlertDescription>
        </Alert>
      )}

      {/* Financial Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receivables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalReceivables)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPayables)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Warehouses
            </CardTitle>
            <Warehouse className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.warehouseCount}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Units in inventory</p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Sales revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.lowStockCount > 0 ? 'text-destructive' : ''
              }`}>
              {stats.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/warehouses">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-muted"
              >
                <Warehouse className="mr-3 h-4 w-4" />
                Manage Warehouses
              </Button>
            </Link>
            <Link to="/stock">
              <Button
                variant="ghost"
                className="w-full justify-start hover:bg-muted"
              >
                <Package className="mr-3 h-4 w-4" />
                Manage Stock
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{company?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company Code</p>
              <p className="font-mono font-medium">{company?.companyCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="font-medium capitalize">
                {company?.type?.replace('_', ' ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
