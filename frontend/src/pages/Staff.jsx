import React, { useState, useEffect } from 'react'
import { Users, Shield, UserCheck, UserX, Trash2, Edit, Search } from 'lucide-react'
import { staffAPI } from '../lib/api'
import { formatDate } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { Checkbox } from '../components/ui/checkbox'
import { Pagination } from '../components/ui/Pagination'

const Staff = () => {
    const [staff, setStaff] = useState([])
    const [filteredStaff, setFilteredStaff] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const { toast } = useToast()

    // Dialog states
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newRole, setNewRole] = useState('')
    const [permissions, setPermissions] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

    useEffect(() => {
        fetchStaff()
    }, [])

    useEffect(() => {
        filterStaff()
    }, [staff, searchTerm, roleFilter, statusFilter])

    const fetchStaff = async () => {
        try {
            setLoading(true)
            const response = await staffAPI.getAll()
            setStaff(response.data.staff || [])
        } catch (error) {
            console.error('Failed to fetch staff:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load staff',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const filterStaff = () => {
        let filtered = [...staff]

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter)
        }

        // Status filter
        if (statusFilter === 'active') {
            filtered = filtered.filter(user => user.isActive)
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(user => !user.isActive)
        }

        setFilteredStaff(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }

    const getRoleBadge = (role) => {
        const variants = {
            owner: 'default',
            admin: 'secondary',
            manager: 'outline',
            staff: 'outline',
            new_joinee: 'destructive'
        }
        const labels = {
            owner: 'Owner',
            admin: 'Admin',
            manager: 'Manager',
            staff: 'Staff',
            new_joinee: 'New Joinee'
        }
        return <Badge variant={variants[role]}>{labels[role]}</Badge>
    }

    const getStatusBadge = (isActive, role) => {
        if (role === 'new_joinee') {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
        }
        return isActive
            ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
            : <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>
    }

    const openRoleDialog = (user) => {
        setSelectedUser(user)
        setNewRole(user.role)
        setRoleDialogOpen(true)
    }

    const openPermissionsDialog = (user) => {
        setSelectedUser(user)
        setPermissions(user.permissions || {})
        setPermissionsDialogOpen(true)
    }

    const handleUpdateRole = async () => {
        if (!selectedUser || !newRole) return

        try {
            setSubmitting(true)
            await staffAPI.updateRole(selectedUser._id, newRole)

            toast({
                title: 'Success',
                description: 'Role updated successfully'
            })

            setRoleDialogOpen(false)
            fetchStaff()
        } catch (error) {
            console.error('Failed to update role:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update role',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdatePermissions = async () => {
        if (!selectedUser) return

        try {
            setSubmitting(true)
            await staffAPI.updatePermissions(selectedUser._id, permissions)

            toast({
                title: 'Success',
                description: 'Permissions updated successfully'
            })

            setPermissionsDialogOpen(false)
            fetchStaff()
        } catch (error) {
            console.error('Failed to update permissions:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update permissions',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleStatus = async (user) => {
        try {
            await staffAPI.updateStatus(user._id, !user.isActive)

            toast({
                title: 'Success',
                description: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`
            })

            fetchStaff()
        } catch (error) {
            console.error('Failed to update status:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update status',
                variant: 'destructive'
            })
        }
    }

    const handleRemoveUser = async (user) => {
        if (!window.confirm(`Are you sure you want to remove ${user.fullName} from the company?`)) {
            return
        }

        try {
            await staffAPI.remove(user._id)

            toast({
                title: 'Success',
                description: 'User removed successfully'
            })

            fetchStaff()
        } catch (error) {
            console.error('Failed to remove user:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to remove user',
                variant: 'destructive'
            })
        }
    }

    const canManageStaff = currentUser.permissions?.canManageStaff
    const isOwner = currentUser.role === 'owner'

    // Calculate pagination
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading staff...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Staff Management</h1>
                    <p className="text-muted-foreground">Manage team members, roles, and permissions</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                    <Users className="h-5 w-5 mr-2" />
                    {staff.length} {staff.length === 1 ? 'Member' : 'Members'}
                </Badge>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role-filter">Role</Label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger id="role-filter">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="new_joinee">New Joinee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status-filter">Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger id="status-filter">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Staff Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>View and manage all staff members</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                {canManageStaff && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManageStaff ? 6 : 5} className="text-center text-muted-foreground">
                                        No staff members found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedStaff.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell className="font-medium">{user.fullName}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                                        <TableCell>{getStatusBadge(user.isActive, user.role)}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                                        {canManageStaff && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {user._id !== currentUser._id && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openRoleDialog(user)}
                                                                title="Change Role"
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openPermissionsDialog(user)}
                                                                title="Edit Permissions"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleToggleStatus(user)}
                                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                            </Button>
                                                            {isOwner && user.role !== 'owner' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveUser(user)}
                                                                    title="Remove User"
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredStaff.length}
                    />
                </CardContent>
            </Card>

            {/* Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>
                            Update role for {selectedUser?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-role">New Role</Label>
                            <Select value={newRole} onValueChange={setNewRole}>
                                <SelectTrigger id="new-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="new_joinee">New Joinee</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateRole} disabled={submitting || newRole === selectedUser?.role}>
                                {submitting ? 'Updating...' : 'Update Role'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Permissions</DialogTitle>
                        <DialogDescription>
                            Manage permissions for {selectedUser?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="font-semibold">Management</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageStaff"
                                        checked={permissions.canManageStaff}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageStaff: checked })}
                                    />
                                    <label htmlFor="canManageStaff" className="text-sm cursor-pointer">
                                        Manage Staff
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageSettings"
                                        checked={permissions.canManageSettings}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageSettings: checked })}
                                    />
                                    <label htmlFor="canManageSettings" className="text-sm cursor-pointer">
                                        Manage Settings
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">Inventory</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageInventory"
                                        checked={permissions.canManageInventory}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageInventory: checked })}
                                    />
                                    <label htmlFor="canManageInventory" className="text-sm cursor-pointer">
                                        Manage Inventory
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">Orders & Deliveries</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageSales"
                                        checked={permissions.canManageSales}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageSales: checked })}
                                    />
                                    <label htmlFor="canManageSales" className="text-sm cursor-pointer">
                                        Manage Sales Orders
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManagePurchases"
                                        checked={permissions.canManagePurchases}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManagePurchases: checked })}
                                    />
                                    <label htmlFor="canManagePurchases" className="text-sm cursor-pointer">
                                        Manage Purchase Orders
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageDeliveries"
                                        checked={permissions.canManageDeliveries}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageDeliveries: checked })}
                                    />
                                    <label htmlFor="canManageDeliveries" className="text-sm cursor-pointer">
                                        Manage Deliveries (In/Out)
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">Contacts</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageClients"
                                        checked={permissions.canManageClients}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageClients: checked })}
                                    />
                                    <label htmlFor="canManageClients" className="text-sm cursor-pointer">
                                        Manage Clients
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageSuppliers"
                                        checked={permissions.canManageSuppliers}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageSuppliers: checked })}
                                    />
                                    <label htmlFor="canManageSuppliers" className="text-sm cursor-pointer">
                                        Manage Suppliers
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">Accounting</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canViewAccounting"
                                        checked={permissions.canViewAccounting}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canViewAccounting: checked })}
                                    />
                                    <label htmlFor="canViewAccounting" className="text-sm cursor-pointer">
                                        View Accounting
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canManageAccounting"
                                        checked={permissions.canManageAccounting}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canManageAccounting: checked })}
                                    />
                                    <label htmlFor="canManageAccounting" className="text-sm cursor-pointer">
                                        Manage Accounting
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">Reports</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="canViewReports"
                                        checked={permissions.canViewReports}
                                        onCheckedChange={(checked) => setPermissions({ ...permissions, canViewReports: checked })}
                                    />
                                    <label htmlFor="canViewReports" className="text-sm cursor-pointer">
                                        View Reports
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdatePermissions} disabled={submitting}>
                                {submitting ? 'Updating...' : 'Update Permissions'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Staff
