import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  ArrowLeftRight,
  List,
  TrendingUp,
  ShoppingCart,
  Users,
  Warehouse,
  Building2,
  ChevronDown,
  Menu,
  LogOut,
  Truck,
  Wheat
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState({
    stock: true,
    sales: false,
    data: false,
    settings: false
  })

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  const isActive = (path) => location.pathname === path

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      title: 'Warehouses',
      icon: Warehouse,
      path: '/warehouses'
    },
    {
      title: 'Stock Management',
      icon: Package,
      group: 'stock',
      items: [
        { title: 'Stock List', icon: Package, path: '/stock' },
        { title: 'Stock In', icon: ArrowDownToLine, path: '/stock-in' },
        { title: 'Stock Out', icon: ArrowUpFromLine, path: '/stock-out' },
        { title: 'Stock Adjust', icon: Settings, path: '/stock-adjust' },
        { title: 'Stock Move', icon: ArrowLeftRight, path: '/stock-move' },
        { title: 'Stock Transactions', icon: List, path: '/stock-transactions' }
      ]
    },
    {
      title: 'Sales & Purchases',
      icon: TrendingUp,
      group: 'sales',
      items: [
        { title: 'Sales', icon: TrendingUp, path: '/sales' },
        { title: 'Purchases', icon: ShoppingCart, path: '/purchases' },
        { title: 'Clients', icon: Users, path: '/clients' },
        { title: 'Suppliers', icon: Truck, path: '/suppliers' }
      ]
    },
    ...(user?.permissions?.canManageStaff ? [{
      title: 'Staff Management',
      icon: Users,
      path: '/staff'
    }] : []),
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r transition-transform duration-300 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Wheat className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{user?.companyId?.name || 'Company'}</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {user?.companyId?.companyCode || 'CFX-00000'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.group ? (
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                        onClick={() => toggleGroup(item.group)}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedGroups[item.group] ? 'rotate-180' : ''
                          }`} />
                      </Button>

                      {expandedGroups[item.group] && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.items.map((subItem) => (
                            <Link key={subItem.path} to={subItem.path} onClick={() => {
                              // Close sidebar on mobile after navigation
                              if (window.innerWidth < 768) setSidebarOpen(false)
                            }}>
                              <Button
                                variant={isActive(subItem.path) ? "secondary" : "ghost"}
                                className="w-full justify-start p-2 h-auto"
                              >
                                <subItem.icon className="h-4 w-4 mr-3" />
                                <span className="text-sm">{subItem.title}</span>
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to={item.path} onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 768) setSidebarOpen(false)
                    }}>
                      <Button
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className="w-full justify-start p-2 h-auto"
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        <span className="text-sm">{item.title}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* User Menu */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user?.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:ml-64">
        {/* Top Bar */}
        <header className="bg-card border-b px-4 md:px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              {/* Breadcrumb or page context can go here */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
