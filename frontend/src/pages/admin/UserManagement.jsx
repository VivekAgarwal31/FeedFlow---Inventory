import React, { useState, useEffect } from 'react'
import { Plus, Search, Users, Eye, Edit, Trash2, Ban, CheckCircle, Loader2, Key, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { adminAPI } from '../../lib/adminApi'
import { adminSubscriptionAPI } from '../../lib/api'
import { useToast } from '../../hooks/use-toast'
import { formatDate } from '../../lib/utils'
import PlanBadge from '../../components/PlanBadge'

const UserManagement = () => {
    const [users, setUsers] = useState([])
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
    const [planDialogOpen, setPlanDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [userSubscription, setUserSubscription] = useState(null)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [planNotes, setPlanNotes] = useState('')
    const { toast } = useToast()

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        companyId: '',
        role: 'staff'
    })

    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        fetchUsers()
        fetchCompanies()
    }, [])

    // Separate effect for filters
    useEffect(() => {
        if (searchTerm || roleFilter !== 'all' || statusFilter !== 'all') {
            fetchUsers()
        }
    }, [searchTerm, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getUsers({
                search: searchTerm,
                role: roleFilter === 'all' ? '' : roleFilter,
                isActive: statusFilter === 'all' ? '' : statusFilter
            })
            setUsers(response.data.users)
        } catch (error) {
            console.error('Failed to fetch users:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load users',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCompanies = async () => {
        try {
            const response = await adminAPI.getCompanies({ limit: 1000 })
            setCompanies(response.data.companies)
        } catch (error) {
            console.error('Failed to fetch companies:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (selectedUser) {
                await adminAPI.updateUser(selectedUser._id, {
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    role: form.role
                })
                toast({
                    title: 'Success',
                    description: 'User updated successfully'
                })
            } else {
                await adminAPI.createUser(form)
                toast({
                    title: 'Success',
                    description: 'User created successfully'
                })
            }
            setDialogOpen(false)
            resetForm()
            fetchUsers()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save user',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (userId, isActive) => {
        try {
            await adminAPI.updateUserStatus(userId, isActive)
            toast({
                title: 'Success',
                description: `User ${isActive ? 'activated' : 'suspended'} successfully`
            })
            fetchUsers()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update status',
                variant: 'destructive'
            })
        }
    }

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive'
            })
            return
        }

        try {
            setSubmitting(true)
            await adminAPI.resetUserPassword(selectedUser._id, newPassword)
            toast({
                title: 'Success',
                description: 'Password reset successfully'
            })
            setResetPasswordDialogOpen(false)
            setNewPassword('')
            setSelectedUser(null)
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reset password',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            await adminAPI.deleteUser(userId)
            toast({
                title: 'Success',
                description: 'User deleted successfully'
            })
            fetchUsers()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete user',
                variant: 'destructive'
            })
        }
    }

    const openPlanDialog = async (user) => {
        try {
            setSelectedUser(user)
            setPlanDialogOpen(true)
            setSubmitting(true)

            // Fetch user's subscription
            const response = await adminSubscriptionAPI.getUserSubscription(user._id)
            setUserSubscription(response.data.subscription)
            setSelectedPlan(response.data.subscription?.planId?.type || 'free')
        } catch (error) {
            // If no subscription found, default to free
            setUserSubscription(null)
            setSelectedPlan('free')
        } finally {
            setSubmitting(false)
        }
    }

    const handlePlanChange = async () => {
        if (!selectedPlan) {
            toast({
                title: 'Error',
                description: 'Please select a plan',
                variant: 'destructive'
            })
            return
        }

        try {
            setSubmitting(true)
            await adminSubscriptionAPI.updateUserPlan(selectedUser._id, selectedPlan, planNotes)
            toast({
                title: 'Success',
                description: `User plan updated to ${selectedPlan} successfully`
            })
            setPlanDialogOpen(false)
            setPlanNotes('')
            setSelectedUser(null)
            setUserSubscription(null)
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update plan',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const openEditDialog = (user) => {
        setSelectedUser(user)
        setForm({
            fullName: user.fullName,
            email: user.email,
            password: '',
            phone: user.phone || '',
            companyId: user.companyId?._id || '',
            role: user.role
        })
        setDialogOpen(true)
    }

    const resetForm = () => {
        setForm({
            fullName: '',
            email: '',
            password: '',
            phone: '',
            companyId: '',
            role: 'staff'
        })
        setSelectedUser(null)
    }

    const getRoleBadgeColor = (role) => {
        const colors = {
            super_admin: 'bg-red-100 text-red-800',
            owner: 'bg-purple-100 text-purple-800',
            admin: 'bg-blue-100 text-blue-800',
            manager: 'bg-green-100 text-green-800',
            staff: 'bg-gray-100 text-gray-800'
        }
        return colors[role] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">Manage all users across all companies</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                            <DialogDescription>
                                {selectedUser ? 'Update user information' : 'Add a new user to any company'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Full Name *</Label>
                                <Input
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    disabled={!!selectedUser}
                                />
                            </div>
                            {!selectedUser && (
                                <div>
                                    <Label>Password *</Label>
                                    <Input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required={!selectedUser}
                                        minLength={6}
                                    />
                                </div>
                            )}
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Company *</Label>
                                <Select
                                    value={form.companyId}
                                    onValueChange={(value) => setForm({ ...form, companyId: value })}
                                    disabled={!!selectedUser}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company) => (
                                            <SelectItem key={company._id} value={company._id}>
                                                {company.name} ({company.companyCode})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Role *</Label>
                                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">Owner</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        selectedUser ? 'Update User' : 'Create User'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users ({users.length})</CardTitle>
                    <CardDescription>All users across all companies</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No users found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell className="font-medium">{user.fullName || 'N/A'}</TableCell>
                                        <TableCell>{user.email || 'N/A'}</TableCell>
                                        <TableCell>
                                            {user.companyId?.name || 'N/A'}
                                            <br />
                                            <span className="text-xs text-gray-500 font-mono">
                                                {user.companyId?.companyCode || ''}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {user.role || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.subscription ? (
                                                <PlanBadge
                                                    planType={user.subscription.planId?.type}
                                                    planName={user.subscription.planId?.name}
                                                />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No plan</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openPlanDialog(user)}
                                                    title="Manage Plan"
                                                >
                                                    <Crown className="h-4 w-4 text-yellow-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(user)
                                                        setResetPasswordDialogOpen(true)
                                                    }}
                                                >
                                                    <Key className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                {user.isActive ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(user._id, false)}
                                                    >
                                                        <Ban className="h-4 w-4 text-orange-600" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(user._id, true)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Reset Password Dialog */}
            <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Set a new password for {selectedUser?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                minLength={6}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleResetPassword}
                                disabled={submitting || !newPassword || newPassword.length < 6}
                                className="flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setResetPasswordDialogOpen(false)
                                    setNewPassword('')
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Plan Management Dialog */}
            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Manage User Plan</DialogTitle>
                        <DialogDescription>
                            Change subscription plan for {selectedUser?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {userSubscription && (
                            <div className="p-4 bg-muted rounded-lg">
                                <Label className="text-sm font-medium">Current Plan</Label>
                                <div className="mt-2 flex items-center gap-2">
                                    <PlanBadge
                                        planType={userSubscription.planId?.type}
                                        planName={userSubscription.planId?.name}
                                    />
                                    {userSubscription.trial?.isTrial && userSubscription.trial?.endsAt && (
                                        <span className="text-sm text-muted-foreground">
                                            (Ends: {formatDate(userSubscription.trial.endsAt)})
                                        </span>
                                    )}
                                </div>
                                {userSubscription.updatedByAdmin && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ⚠️ Plan manually set by admin
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <Label>New Plan *</Label>
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free Plan</SelectItem>
                                    <SelectItem value="trial">Trial Plan (14 days)</SelectItem>
                                    <SelectItem value="paid">Paid Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Admin Notes (Optional)</Label>
                            <Input
                                value={planNotes}
                                onChange={(e) => setPlanNotes(e.target.value)}
                                placeholder="Reason for plan change..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handlePlanChange}
                                disabled={submitting || !selectedPlan}
                                className="flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Plan'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPlanDialogOpen(false)
                                    setPlanNotes('')
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UserManagement
