import React, { useState, useEffect } from 'react'
import { Building2, Users, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { adminAPI } from '../../lib/adminApi'
import { useToast } from '../../hooks/use-toast'

const AdminDashboard = () => {
    const [overview, setOverview] = useState(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        fetchOverview()
    }, [])

    const fetchOverview = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getOverview()
            setOverview(response.data.overview)
        } catch (error) {
            console.error('Failed to fetch overview:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load overview',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        )
    }

    const stats = [
        {
            title: 'Total Companies',
            value: overview?.companies?.total || 0,
            change: `+${overview?.companies?.newThisMonth || 0} this month`,
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Active Companies',
            value: overview?.companies?.active || 0,
            change: `${overview?.companies?.suspended || 0} suspended`,
            icon: Activity,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Total Users',
            value: overview?.users?.total || 0,
            change: `+${overview?.users?.newThisMonth || 0} this month`,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            title: 'Active Users',
            value: overview?.users?.active || 0,
            change: `${overview?.users?.inactive || 0} inactive`,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        }
    ]

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
                <p className="text-gray-600 mt-2">Monitor and manage all companies and users</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Status</CardTitle>
                        <CardDescription>Distribution of company statuses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {overview?.companies?.active || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Suspended</span>
                                <span className="text-2xl font-bold text-orange-600">
                                    {overview?.companies?.suspended || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                        <CardDescription>User status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Active Users</span>
                                <span className="text-2xl font-bold text-green-600">
                                    {overview?.users?.active || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Inactive Users</span>
                                <span className="text-2xl font-bold text-gray-600">
                                    {overview?.users?.inactive || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default AdminDashboard
