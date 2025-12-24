import React, { useState, useEffect } from 'react'
import { Plus, Search, Building2, Eye, Edit, Trash2, Ban, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { adminAPI } from '../../lib/adminApi'
import { useToast } from '../../hooks/use-toast'
import { formatDate } from '../../lib/utils'

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedCompany, setSelectedCompany] = useState(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()

    const [form, setForm] = useState({
        name: '',
        email: '',
        type: 'all',
        address: '',
        contactNumber: '',
        gstNumber: '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    })

    useEffect(() => {
        fetchCompanies()
    }, [searchTerm, statusFilter])

    const fetchCompanies = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getCompanies({
                search: searchTerm,
                status: statusFilter === 'all' ? '' : statusFilter
            })
            setCompanies(response.data.companies)
        } catch (error) {
            console.error('Failed to fetch companies:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load companies',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            if (selectedCompany) {
                await adminAPI.updateCompany(selectedCompany._id, {
                    name: form.name,
                    email: form.email,
                    type: form.type,
                    address: form.address,
                    contactNumber: form.contactNumber,
                    gstNumber: form.gstNumber
                })
                toast({
                    title: 'Success',
                    description: 'Company updated successfully'
                })
            } else {
                await adminAPI.createCompany(form)
                toast({
                    title: 'Success',
                    description: 'Company created successfully'
                })
            }
            setDialogOpen(false)
            resetForm()
            fetchCompanies()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save company',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (companyId, newStatus) => {
        try {
            await adminAPI.updateCompanyStatus(companyId, newStatus)
            toast({
                title: 'Success',
                description: `Company ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`
            })
            fetchCompanies()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update status',
                variant: 'destructive'
            })
        }
    }

    const handleDelete = async () => {
        if (deleteConfirmText !== selectedCompany?.name) {
            toast({
                title: 'Error',
                description: 'Company name does not match',
                variant: 'destructive'
            })
            return
        }

        try {
            setSubmitting(true)
            const response = await adminAPI.deleteCompany(selectedCompany._id)
            toast({
                title: 'Success',
                description: `Company deleted. Removed: ${response.data.deletionStats.total || 'all'} records`
            })
            setDeleteDialogOpen(false)
            setDeleteConfirmText('')
            setSelectedCompany(null)
            fetchCompanies()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete company',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const viewDetails = async (company) => {
        try {
            const response = await adminAPI.getCompany(company._id)
            setSelectedCompany(response.data.company)
            setDetailsDialogOpen(true)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load company details',
                variant: 'destructive'
            })
        }
    }

    const openEditDialog = (company) => {
        setSelectedCompany(company)
        setForm({
            name: company.name,
            email: company.email || '',
            type: company.type || 'all',
            address: company.address || '',
            contactNumber: company.contactNumber || '',
            gstNumber: company.gstNumber || '',
            ownerName: '',
            ownerEmail: '',
            ownerPassword: ''
        })
        setDialogOpen(true)
    }

    const resetForm = () => {
        setForm({
            name: '',
            email: '',
            type: 'all',
            address: '',
            contactNumber: '',
            gstNumber: '',
            ownerName: '',
            ownerEmail: '',
            ownerPassword: ''
        })
        setSelectedCompany(null)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
                    <p className="text-gray-600 mt-2">Manage all companies in the system</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Company
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedCompany ? 'Edit Company' : 'Create New Company'}</DialogTitle>
                            <DialogDescription>
                                {selectedCompany ? 'Update company information' : 'Add a new company to the system'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Company Name *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                                    />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="wholesale">Wholesale</SelectItem>
                                            <SelectItem value="retail">Retail</SelectItem>
                                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Contact Number</Label>
                                    <Input
                                        value={form.contactNumber}
                                        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>GST Number</Label>
                                    <Input
                                        value={form.gstNumber}
                                        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Address</Label>
                                    <Input
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            {!selectedCompany && (
                                <>
                                    <div className="border-t pt-4">
                                        <h3 className="font-medium mb-3">Owner Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Owner Name *</Label>
                                                <Input
                                                    value={form.ownerName}
                                                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                                                    required={!selectedCompany}
                                                />
                                            </div>
                                            <div>
                                                <Label>Owner Email *</Label>
                                                <Input
                                                    type="email"
                                                    value={form.ownerEmail}
                                                    onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                                                    required={!selectedCompany}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <Label>Owner Password *</Label>
                                                <Input
                                                    type="password"
                                                    value={form.ownerPassword}
                                                    onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                                                    required={!selectedCompany}
                                                    minLength={6}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        selectedCompany ? 'Update Company' : 'Create Company'
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
                                    placeholder="Search companies..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Companies Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Companies ({companies.length})</CardTitle>
                    <CardDescription>All registered companies in the system</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No companies found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {companies.map((company) => (
                                    <TableRow key={company._id}>
                                        <TableCell className="font-medium">{company.name}</TableCell>
                                        <TableCell className="font-mono text-sm">{company.companyCode}</TableCell>
                                        <TableCell>{company.ownerId?.fullName || 'N/A'}</TableCell>
                                        <TableCell>{company.userCount || 0}</TableCell>
                                        <TableCell>
                                            <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                                                {company.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(company.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => viewDetails(company)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(company)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {company.status === 'active' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(company._id, 'suspended')}
                                                    >
                                                        <Ban className="h-4 w-4 text-orange-600" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleStatusChange(company._id, 'active')}
                                                    >
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCompany(company)
                                                        setDeleteDialogOpen(true)
                                                    }}
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

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Company Details</DialogTitle>
                    </DialogHeader>
                    {selectedCompany && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-600">Company Name</Label>
                                    <p className="font-medium">{selectedCompany.name}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Company Code</Label>
                                    <p className="font-mono">{selectedCompany.companyCode}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Email</Label>
                                    <p>{selectedCompany.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600">Status</Label>
                                    <Badge variant={selectedCompany.status === 'active' ? 'default' : 'secondary'}>
                                        {selectedCompany.status}
                                    </Badge>
                                </div>
                            </div>
                            {selectedCompany.dataStats && (
                                <div>
                                    <Label className="text-gray-600 mb-2 block">Data Statistics</Label>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <p className="text-2xl font-bold">{selectedCompany.dataStats.users}</p>
                                            <p className="text-xs text-gray-600">Users</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <p className="text-2xl font-bold">{selectedCompany.dataStats.sales}</p>
                                            <p className="text-xs text-gray-600">Sales</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <p className="text-2xl font-bold">{selectedCompany.dataStats.purchases}</p>
                                            <p className="text-xs text-gray-600">Purchases</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded">
                                            <p className="text-2xl font-bold">{selectedCompany.dataStats.stockItems}</p>
                                            <p className="text-xs text-gray-600">Stock Items</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Company</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the company and ALL associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant="destructive">
                        <AlertDescription>
                            All data including users, sales, purchases, stock items, clients, suppliers, and warehouses will be permanently deleted.
                        </AlertDescription>
                    </Alert>
                    <div>
                        <Label>Type company name to confirm: <strong>{selectedCompany?.name}</strong></Label>
                        <Input
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Enter company name"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={submitting || deleteConfirmText !== selectedCompany?.name}
                            className="flex-1"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Company'
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteDialogOpen(false)
                                setDeleteConfirmText('')
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default CompanyManagement
