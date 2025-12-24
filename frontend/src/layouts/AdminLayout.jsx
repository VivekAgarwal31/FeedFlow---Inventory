import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Users, BarChart3, LogOut, Shield } from 'lucide-react'
import { Button } from '../components/ui/button'

const AdminLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Check if user is super_admin
    if (user.role !== 'super_admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-4">You need super admin privileges to access this area.</p>
                    <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
                </div>
            </div>
        )
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    const navItems = [
        { path: '/admin', label: 'Overview', icon: BarChart3 },
        { path: '/admin/companies', label: 'Companies', icon: Building2 },
        { path: '/admin/users', label: 'Users', icon: Users }
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gray-900 text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-yellow-400" />
                            <div>
                                <h1 className="text-xl font-bold">Admin Panel</h1>
                                <p className="text-sm text-gray-400">System Administration</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-300">{user.fullName}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="bg-white text-gray-900 hover:bg-gray-100 border-gray-300"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="flex gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${isActive
                                        ? 'border-blue-600 text-blue-600 font-medium'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
