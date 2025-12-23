import React, { useState, useEffect } from 'react'
import { Plus, Truck, Phone, Mail, MapPin, Loader2, ArrowLeft, Calendar, Filter, Eye, Download, Search, Trash2 } from 'lucide-react'
import { supplierAPI, purchaseAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { exportSupplierToExcel, exportSupplierToPDF } from '../lib/exportUtils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { Pagination } from '../components/ui/Pagination'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [supplierTransactions, setSupplierTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [dateFilter, setDateFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportForm, setExportForm] = useState({
    supplierName: '',
    fromDate: '',
    toDate: '',
    format: 'excel'
  })
  const [exportSuppliers, setExportSuppliers] = useState([])
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    paymentTerms: ''
  })

  useEffect(() => {
    fetchSuppliers()
    fetchExportSuppliers()
  }, [])

  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierTransactions(selectedSupplier._id)
    }
  }, [selectedSupplier])

  useEffect(() => {
    filterTransactions()
  }, [supplierTransactions, dateFilter, searchTerm])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await supplierAPI.getAll()
      setSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load suppliers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplierTransactions = async (supplierId) => {
    try {
      const response = await supplierAPI.getById(supplierId)
      setSupplierTransactions(response.data.purchases || [])
    } catch (error) {
      console.error('Failed to fetch supplier transactions:', error)
    }
  }

  const viewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase)
    setDetailsDialogOpen(true)
  }

  const filterTransactions = () => {
    let filtered = supplierTransactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.items?.some(item =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      let filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case '3months':
          filterDate.setMonth(now.getMonth() - 3)
          break
        default:
          filterDate = null
      }

      if (filterDate) {
        filtered = filtered.filter(transaction =>
          new Date(transaction.purchaseDate || transaction.createdAt) >= filterDate
        )
      }
    }

    setFilteredTransactions(filtered)
  }

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier)
    setDateFilter('all')
    setSearchTerm('')
    fetchSupplierTransactions(supplier._id)
  }

  const handleBackToSuppliers = () => {
    setSelectedSupplier(null)
    setSupplierTransactions([])
    setFilteredTransactions([])
    setDateFilter('all')
    setSearchTerm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await supplierAPI.create(form)

      toast({
        title: 'Success',
        description: 'Supplier created successfully'
      })

      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        paymentTerms: ''
      })
      setDialogOpen(false)
      fetchSuppliers() // Refresh list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create supplier')
    } finally {
      setSubmitting(false)
    }
  }

  // Export functionality
  const fetchExportSuppliers = async () => {
    try {
      const response = await supplierAPI.getAll()
      setExportSuppliers(response.data.suppliers || [])
    } catch (error) {
      console.error('Failed to fetch export suppliers:', error)
    }
  }

  const handleSupplierSelect = (supplierName) => {
    setExportForm({ ...exportForm, supplierName })
    setSupplierSearch(supplierName)
    setShowSupplierDropdown(false)
  }

  const filteredExportSuppliers = exportSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  )


  const handleDeleteSupplier = async (supplierId, supplierName) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${supplierName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await supplierAPI.delete(supplierId)
      setSuppliers(prev => prev.filter(s => s._id !== supplierId))
      toast({
        title: 'Success',
        description: 'Supplier deleted successfully'
      })

      // If we're viewing this supplier's details, go back to list
      if (selectedSupplier?._id === supplierId) {
        setSelectedSupplier(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete supplier',
        variant: 'destructive'
      })
    }
  }

  const handleExport = async () => {
    if (!exportForm.supplierName || !exportForm.fromDate || !exportForm.toDate) {
      setError('Please fill all export fields')
      return
    }

    setExporting(true)
    setError('')

    try {
      // Find the supplier by name
      const supplier = suppliers.find(s =>
        s.name.toLowerCase() === exportForm.supplierName.toLowerCase()
      )

      if (!supplier) {
        setError('Supplier not found')
        return
      }

      // Get purchase transactions from MongoDB API
      const response = await purchaseAPI.getAll({
        supplierId: supplier._id,
        page: 1,
        limit: 1000
      })

      const allPurchases = response.data.purchases || []

      // Filter by date range
      const fromDate = new Date(exportForm.fromDate)
      const toDate = new Date(exportForm.toDate)
      toDate.setHours(23, 59, 59, 999) // Include the entire end date

      const filteredPurchases = allPurchases.filter(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate || purchase.createdAt)
        return purchaseDate >= fromDate && purchaseDate <= toDate
      })

      if (filteredPurchases.length === 0) {
        setError('No transactions found for the selected supplier and date range')
        return
      }

      // Prepare transaction data
      const transactions = filteredPurchases.map(purchase => ({
        _id: purchase._id,
        createdAt: purchase.createdAt,
        reference: purchase.referenceNumber || `PUR-${purchase._id.slice(-6)}`,
        itemName: purchase.stockItemId?.itemName || 'Unknown Item',
        quantity: purchase.quantity,
        unitCost: purchase.unitCost,
        totalCost: purchase.totalCost,
        notes: purchase.notes || `Purchase from ${purchase.supplierName}`
      }))

      const dateRange = {
        from: exportForm.fromDate,
        to: exportForm.toDate
      }

      // Export based on format
      if (exportForm.format === 'excel') {
        await exportSupplierToExcel(exportForm.supplierName, transactions, dateRange)
      } else {
        exportSupplierToPDF(exportForm.supplierName, transactions, dateRange)
      }

      setExportDialogOpen(false)
      setExportForm({
        supplierName: '',
        fromDate: '',
        toDate: '',
        format: 'excel'
      })
      setSupplierSearch('')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(suppliers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSuppliers = suppliers.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show supplier details view if a supplier is selected
  if (selectedSupplier) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToSuppliers}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Suppliers
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedSupplier.name}</h1>
              <p className="text-muted-foreground mt-1">
                Purchase history and details
              </p>
            </div>
          </div>
        </div>

        {/* Supplier Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedSupplier.totalPurchases)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{selectedSupplier.purchaseCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Purchase</p>
                  <p className="text-lg font-semibold">
                    {selectedSupplier.lastPurchase ? formatDate(selectedSupplier.lastPurchase) : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Filtered Results</p>
                  <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Transaction Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Transactions</Label>
                <Input
                  id="search"
                  placeholder="Search by item name or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Total Filtered Amount</Label>
                <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm font-medium">
                    {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>
              All purchase transactions from {selectedSupplier.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {supplierTransactions.length === 0
                    ? 'No transactions found for this supplier'
                    : 'No transactions match your current filters'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {transaction.items && transaction.items.length > 0
                            ? transaction.items.length === 1
                              ? transaction.items[0].itemName
                              : `${transaction.items[0].itemName}...`
                            : 'Unknown'}
                          {transaction.items && transaction.items.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.items.length} items
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.items && transaction.items.length > 0
                          ? transaction.items.length === 1
                            ? transaction.items[0].warehouseName || '-'
                            : (() => {
                              const warehouses = [...new Set(transaction.items.map(i => i.warehouseName).filter(Boolean))];
                              return warehouses.length > 1
                                ? `${warehouses.length} warehouses`
                                : warehouses[0] || '-';
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {transaction.items && transaction.items.length > 0
                          ? `${transaction.items.reduce((sum, item) => sum + item.quantity, 0)} bags`
                          : '0 bags'}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{formatCurrency(transaction.totalAmount || 0)}</TableCell>
                      <TableCell>
                        {transaction.items && transaction.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewPurchaseDetails(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Purchase Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Details</DialogTitle>
              <DialogDescription>
                {selectedPurchase && (
                  <>
                    Purchase on {formatDate(selectedPurchase.createdAt)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedPurchase && selectedPurchase.items && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedPurchase.totalAmount)}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Total Quantity:</span>
                    <p className="font-medium">{selectedPurchase.items.reduce((sum, item) => sum + item.quantity, 0)} bags</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items Count:</span>
                    <p className="font-medium">{selectedPurchase.items.length} items</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Items Breakdown</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="font-mono">{item.warehouseName}</TableCell>
                          <TableCell className="font-mono">{item.quantity} bags</TableCell>
                          <TableCell className="font-mono">{formatCurrency(item.costPrice || 0)}</TableCell>
                          <TableCell className="font-mono font-medium">{formatCurrency(item.quantity * (item.costPrice || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your supplier database and purchase relationships
          </p>
        </div>

        <div className="flex gap-3">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Supplier Data
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>
                  Add a new supplier to your database for purchase tracking.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier-name">Supplier Name *</Label>
                  <Input
                    id="supplier-name"
                    type="text"
                    placeholder="ABC Feed Suppliers"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-email">Email</Label>
                    <Input
                      id="supplier-email"
                      type="email"
                      placeholder="contact@supplier.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier-phone">Phone</Label>
                    <Input
                      id="supplier-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier-address">Address</Label>
                  <Input
                    id="supplier-address"
                    type="text"
                    placeholder="123 Industrial Area, City, State"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-gst">GST Number</Label>
                    <Input
                      id="supplier-gst"
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier-credit">Credit Terms (days)</Label>
                    <Input
                      id="supplier-credit"
                      type="number"
                      placeholder="30"
                      value={form.creditTerms}
                      onChange={(e) => setForm({ ...form, creditTerms: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Supplier'
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

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Supplier Data</DialogTitle>
              <DialogDescription>
                Export transaction data for a specific supplier within a date range.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-supplier">Supplier Name *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="export-supplier"
                    type="text"
                    placeholder="Search or type supplier name"
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value)
                      setExportForm({ ...exportForm, supplierName: e.target.value })
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    className="pl-8"
                    required
                  />
                  {showSupplierDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredExportSuppliers.length > 0 ? (
                        filteredExportSuppliers.map((supplier) => (
                          <div
                            key={supplier._id}
                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                            onClick={() => handleSupplierSelect(supplier.name)}
                          >
                            {supplier.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted-foreground">
                          No suppliers found. Type to search.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-date">From Date *</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={exportForm.fromDate}
                    onChange={(e) => setExportForm({ ...exportForm, fromDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to-date">To Date *</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={exportForm.toDate}
                    onChange={(e) => setExportForm({ ...exportForm, toDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="export-format">Export Format *</Label>
                <Select value={exportForm.format} onValueChange={(value) => setExportForm({ ...exportForm, format: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleExport} disabled={exporting} className="flex-1">
                  {exporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setExportDialogOpen(false)
                    setError('')
                    setSupplierSearch('')
                  }}
                  disabled={exporting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Suppliers Table */}
      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No suppliers yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Add your first supplier to start tracking purchases
            </CardDescription>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Purchase Count</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.map((supplier) => (
                <TableRow key={supplier._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSupplierClick(supplier)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-medium">{supplier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{formatCurrency(supplier.totalPurchases)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{supplier.purchaseCount}</span>
                  </TableCell>
                  <TableCell>
                    {supplier.lastPurchase ? (
                      formatDate(supplier.lastPurchase)
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleSupplierClick(supplier)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSupplier(supplier._id, supplier.name)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={suppliers.length}
          />
        </Card>
      )}
    </div>
  )
}

export default Suppliers
