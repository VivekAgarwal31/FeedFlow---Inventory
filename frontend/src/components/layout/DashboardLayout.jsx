import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  Wheat,
  Package as PackageIcon,
  FileBarChart,
  DollarSign,
  Book,
  FileText,
  Calculator,
  Edit,
  Search
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
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [filteredResults, setFilteredResults] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({
    stock: true,
    sales: false,
    purchases: false,
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
        { title: 'Stock Adjust', icon: Settings, path: '/stock-adjust' },
        { title: 'Stock Move', icon: ArrowLeftRight, path: '/stock-move' },
        { title: 'Stock Transactions', icon: List, path: '/stock-transactions' }
      ]
    },
    {
      title: 'Sales',
      icon: TrendingUp,
      group: 'sales',
      items: [
        { title: 'Sales Orders', icon: FileBarChart, path: '/sales-orders' },
        { title: 'Delivery Out', icon: ArrowUpFromLine, path: '/delivery-out' },
        { title: 'Clients', icon: Users, path: '/clients' },
        { title: 'Receivables', icon: DollarSign, path: '/accounts-receivable' }
      ]
    },
    {
      title: 'Purchases',
      icon: ShoppingCart,
      group: 'purchases',
      items: [
        { title: 'Purchase Orders', icon: FileBarChart, path: '/purchase-orders' },
        { title: 'Delivery In (GRN)', icon: ArrowDownToLine, path: '/delivery-in' },
        { title: 'Suppliers', icon: Truck, path: '/suppliers' },
        { title: 'Payables', icon: DollarSign, path: '/accounts-payable' }
      ]
    },
    ...(user?.permissions?.canManageStaff ? [{
      title: 'Staff Management',
      icon: Users,
      path: '/staff'
    }] : []),
    {
      title: 'Accounting',
      icon: Book,
      group: 'accounting',
      items: [
        { title: 'Entries Register', icon: FileText, path: '/accounting/entries-register' },
        { title: 'Cashbook', icon: Book, path: '/accounting/cashbook' },
        { title: 'Wages Calculator', icon: Calculator, path: '/accounting/wages' },
        { title: 'Manual Entry', icon: Edit, path: '/accounting/manual-entry' }
      ]
    },
    {
      title: 'Reports',
      icon: FileBarChart,
      path: '/reports'
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ]

  const handleLogout = () => {
    logout()
  }

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (!query.trim()) {
      setShowSearchDropdown(false)
      setFilteredResults([])
      return
    }

    // Create searchable items list
    const searchableItems = []
    menuItems.forEach(item => {
      if (item.path) {
        searchableItems.push({ title: item.title, path: item.path, icon: item.icon })
      }
      if (item.items) {
        item.items.forEach(subItem => {
          searchableItems.push({ title: subItem.title, path: subItem.path, icon: subItem.icon, parent: item.title })
        })
      }
    })

    // Filter matching items
    const matches = searchableItems.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )

    setFilteredResults(matches)
    setShowSearchDropdown(matches.length > 0)
  }

  // Handle search item click
  const handleSearchItemClick = (path) => {
    navigate(path)
    setSearchQuery('')
    setShowSearchDropdown(false)
    setFilteredResults([])
  }

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault()
    if (filteredResults.length > 0) {
      handleSearchItemClick(filteredResults[0].path)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dark Top Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 z-50 flex items-center justify-between px-4 gap-4">
        {/* Logo - Left */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img
            src="/stockwise logo.webp"
            alt="Stockwise Logo"
            className="h-14 object-contain py-1"
          />
        </div>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl mx-auto relative">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search features (e.g., Dashboard, Stock List, Sales Orders...)"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              className="w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </form>

          {/* Search Dropdown */}
          {showSearchDropdown && filteredResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
              {filteredResults.map((item, index) => {
                const Icon = item.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleSearchItemClick(item.path)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.title}</div>
                      {item.parent && (
                        <div className="text-xs text-gray-500 truncate">{item.parent}</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* User Info - Right */}
        <div className="flex items-center gap-3 text-white flex-shrink-0">
          <span className="text-sm hidden md:block">{user?.fullName}</span>
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-16 bottom-0 left-0 z-40 bg-gray-50 border-r border-gray-200 transition-transform duration-300 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary rounded-md flex items-center justify-center">
                <PackageIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-gray-900">{user?.companyId?.name || 'Company'}</h2>
                <p className="text-xs text-gray-500 font-mono">
                  {user?.companyId?.companyCode || 'CFX-00000'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.title}>
                  {item.group ? (
                    <div>
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-3 py-2 h-auto hover:bg-gray-200 text-gray-700 font-medium"
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
                        <div className="ml-7 mt-1 space-y-0.5">
                          {item.items.map((subItem) => (
                            <Link key={subItem.path} to={subItem.path} onClick={() => {
                              if (window.innerWidth < 768) setSidebarOpen(false)
                            }}>
                              <Button
                                variant="ghost"
                                className={`w-full justify-start px-3 py-2 h-auto text-sm ${isActive(subItem.path)
                                  ? 'bg-blue-50 text-primary hover:bg-blue-50 font-medium'
                                  : 'text-gray-600 hover:bg-gray-200'
                                  }`}
                              >
                                <subItem.icon className="h-4 w-4 mr-3" />
                                <span>{subItem.title}</span>
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to={item.path} onClick={() => {
                      if (window.innerWidth < 768) setSidebarOpen(false)
                    }}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start px-3 py-2 h-auto ${isActive(item.path)
                          ? 'bg-blue-50 text-primary hover:bg-blue-50 font-medium'
                          : 'text-gray-700 hover:bg-gray-200'
                          }`}
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
          <div className="p-3 border-t border-gray-200 bg-white">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 py-2 h-auto hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize">
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
      <div className="md:ml-64 pt-16 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 sticky top-16 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 flex-grow">
          {children}
        </main>

        {/* Copyright Footer */}
        <footer className="border-t border-gray-200 bg-white py-4 px-4 md:px-6 mt-auto">
          <div className="text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} <span className="font-semibold text-primary">Stockwise</span>. All rights reserved.</p>
            <p className="text-xs text-gray-500 mt-1">Smart Inventory Management System</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
