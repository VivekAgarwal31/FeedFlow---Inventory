import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Warehouse,
  Package,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { companyAPI, dashboardAPI } from '../lib/api'
import { formatCurrency } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch stats and company data in parallel
        const [statsResponse, companyResponse] = await Promise.all([
          dashboardAPI.getStats(),
          companyAPI.get()
        ])

        setStats(statsResponse.data.stats)
        setCompany(companyResponse.data.company)
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's your business overview.
        </p>
      </div>

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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Receivables
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total unpaid bills ₹0.00</p>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalReceivables)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payables
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total unpaid bills ₹0.00</p>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalPayables)}
              </div>
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
