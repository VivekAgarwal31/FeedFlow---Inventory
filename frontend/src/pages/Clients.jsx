import React, { useState, useEffect } from 'react'
import { Plus, Users, Phone, Mail, MapPin, Loader2, ArrowLeft, Calendar, Filter, Eye, Download, Search, Trash2, CreditCard, DollarSign, FileText } from 'lucide-react'
import { clientAPI, saleAPI } from '../lib/api'
import { downloadInvoiceBySale, getClientPayments, recordClientPayment } from '../lib/paymentApi'
import { formatCurrency, formatDate } from '../lib/utils'
import { exportClientToExcel, exportClientToPDF } from '../lib/exportUtils'
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

const Clients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientTransactions, setClientTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const [saleDetailsDialogOpen, setSaleDetailsDialogOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false)
  const [clientPayments, setClientPayments] = useState([])
  const [clientPaymentDialogOpen, setClientPaymentDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  })
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const { toast } = useToast()

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportForm, setExportForm] = useState({
    clientName: '',
    fromDate: '',
    toDate: '',
    format: 'excel'
  })
  const [exportClients, setExportClients] = useState([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
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
    notes: ''
  })

  useEffect(() => {
    fetchClients()
    fetchExportClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      fetchClientTransactions(selectedClient._id)
    }
  }, [selectedClient])

  useEffect(() => {
    filterTransactions()
  }, [clientTransactions, dateFilter, searchTerm])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await clientAPI.getAll()
      setClients(response.data.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load clients',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientTransactions = async (clientId) => {
    try {
      const response = await clientAPI.getById(clientId)
      setClientTransactions(response.data.sales || [])
    } catch (error) {
      console.error('Failed to fetch client transactions:', error)
    }
  }

  const filterTransactions = () => {
    let filtered = clientTransactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.items?.some(item =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        transaction._id.toLowerCase().includes(searchTerm.toLowerCase())
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
          new Date(transaction.saleDate || transaction.createdAt) >= filterDate
        )
      }
    }

    setFilteredTransactions(filtered)
  }

  const handleClientClick = (client) => {
    setSelectedClient(client)
    setDateFilter('all')
    setSearchTerm('')
  }

  const handleBackToClients = () => {
    setSelectedClient(null)
    setClientTransactions([])
    setFilteredTransactions([])
    setDateFilter('all')
    setSearchTerm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await clientAPI.create(form)

      toast({
        title: 'Success',
        description: 'Client created successfully'
      })

      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        notes: ''
      })
      setDialogOpen(false)
      fetchClients() // Refresh clients list
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add client'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale)
    setSaleDetailsDialogOpen(true)
  }

  const handleDownloadInvoice = async (sale) => {
    try {
      const blob = await downloadInvoiceBySale(sale._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${sale.invoiceNumber || sale._id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully'
      })
    } catch (error) {
      console.error('Error downloading invoice:', error)
      // Only show error if it's actually an error (not a blob response)
      if (error.response && error.response.status !== 200) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to download invoice',
          variant: 'destructive'
        })
      }
    }
  }

  const handleViewFinancials = async () => {
    try {
      const response = await getClientPayments(selectedClient._id)
      setClientPayments(response.payments || [])
      setFinancialDialogOpen(true)
    } catch (error) {
      console.error('Error fetching client payments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive'
      })
    }
  }

  const handleOpenClientPayment = () => {
    setPaymentForm({
      amount: '',
      paymentMode: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: ''
    })
    setClientPaymentDialogOpen(true)
  }

  const handleSubmitClientPayment = async (e) => {
    e.preventDefault()

    setSubmittingPayment(true)

    try {
      const response = await recordClientPayment({
        clientId: selectedClient._id,
        amount: parseFloat(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        paymentDate: paymentForm.paymentDate,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      })

      // Show success toast immediately
      toast({
        title: 'Success',
        description: `Payment recorded! ${response.salesUpdated.length} bill(s) updated.${response.overpaidAmount > 0 ? ` Overpaid: ${formatCurrency(response.overpaidAmount)}` : ''}`
      })

      setClientPaymentDialogOpen(false)
      setSubmittingPayment(false)

      // Refresh client data (don't let this fail the whole operation)
      try {
        await fetchClients()

        // Refresh client transactions
        const salesResponse = await saleAPI.getClientSales(selectedClient._id)
        setClientTransactions(salesResponse.sales || [])

        // Update selected client with new data
        const updatedClientsResponse = await clientAPI.getClients()
        const updatedClient = updatedClientsResponse.clients.find(c => c._id === selectedClient._id)
        if (updatedClient) {
          setSelectedClient(updatedClient)
        }
      } catch (refreshError) {
        console.error('Error refreshing client data:', refreshError)
        // Silently fail - payment was successful
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      setSubmittingPayment(false)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await clientAPI.delete(clientId)
      toast({
        title: 'Success',
        description: 'Client deleted successfully'
      })
      fetchClients() // Refresh list
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete client',
        variant: 'destructive'
      })
    }
  }

  // Export functionality
  const fetchExportClients = async () => {
    try {
      const response = await clientAPI.getAll()
      setExportClients(response.data.clients || [])
    } catch (error) {
      console.error('Failed to fetch export clients:', error)
    }
  }

  const handleClientSelect = (clientName) => {
    setExportForm({ ...exportForm, clientName })
    setClientSearch(clientName)
    setShowClientDropdown(false)
  }

  const filteredExportClients = exportClients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handleExport = async () => {
    if (!exportForm.clientName || !exportForm.fromDate || !exportForm.toDate) {
      setError('Please fill all export fields')
      return
    }

    setExporting(true)
    setError('')

    try {
      // Find the client by name
      const client = clients.find(c =>
        c.name.toLowerCase() === exportForm.clientName.toLowerCase()
      )

      if (!client) {
        setError('Client not found')
        return
      }

      // Get sales data from MongoDB API
      const response = await saleAPI.getAll({
        clientId: client._id,
        page: 1,
        limit: 1000
      })

      const allSales = response.data.sales || []

      // Filter by date range
      const fromDate = new Date(exportForm.fromDate)
      const toDate = new Date(exportForm.toDate)
      toDate.setHours(23, 59, 59, 999) // Include the entire end date

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.saleDate || sale.createdAt)
        return saleDate >= fromDate && saleDate <= toDate
      })

      if (filteredSales.length === 0) {
        setError('No transactions found for the selected client and date range')
        return
      }

      // Prepare transaction data
      const transactions = filteredSales.map(sale => ({
        _id: sale._id,
        createdAt: sale.createdAt,
        reference: `SALE-${sale._id.slice(-6)}`,
        itemName: sale.stockItemId?.itemName || 'Unknown Item',
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        totalAmount: sale.totalAmount,
        notes: `Sale to ${sale.clientName}`
      }))

      const dateRange = {
        from: exportForm.fromDate,
        to: exportForm.toDate
      }

      // Export based on format
      if (exportForm.format === 'excel') {
        await exportClientToExcel(exportForm.clientName, transactions, dateRange)
      } else {
        exportClientToPDF(exportForm.clientName, transactions, dateRange)
      }

      setExportDialogOpen(false)
      setExportForm({
        clientName: '',
        fromDate: '',
        toDate: '',
        format: 'excel'
      })
      setClientSearch('')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(clients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = clients.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show client details view if a client is selected
  if (selectedClient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBackToClients}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{selectedClient.name}</h1>
              <p className="text-muted-foreground mt-1">
                Transaction history and details
              </p>
            </div>
          </div>
          <Button onClick={handleOpenClientPayment}>
            <DollarSign className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Client Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedClient.totalPurchases)}</p>
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
                  <p className="text-2xl font-bold">{selectedClient.salesCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedClient.creditLimit || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Receivable</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedClient.currentCredit || 0)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewFinancials}
                  title="View Financial Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          {selectedClient.overpaidAmount > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Overpaid (Credit)</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedClient.overpaidAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                  placeholder="Search by item name or ID..."
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
                    {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.totalAmount, 0))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              All sales transactions with {selectedClient.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {clientTransactions.length === 0
                    ? 'No transactions found for this client'
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
                      <TableCell className="font-mono font-medium">{formatCurrency(transaction.totalAmount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(transaction)}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {transaction.items && transaction.items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewSaleDetails(transaction)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  ```
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sale Details Dialog */}
        <Dialog open={saleDetailsDialogOpen} onOpenChange={setSaleDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>
                {selectedSale && (
                  <>
                    Sale on {formatDate(selectedSale.createdAt)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedSale && selectedSale.items && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedSale.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Quantity:</span>
                    <p className="font-medium">{selectedSale.items.reduce((sum, item) => sum + item.quantity, 0)} bags</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items Count:</span>
                    <p className="font-medium">{selectedSale.items.length} items</p>
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
                      {selectedSale.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>{item.warehouseName || '-'}</TableCell>
                          <TableCell className="font-mono">{item.quantity} bags</TableCell>
                          <TableCell className="font-mono">{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Financial Details Dialog */}
        <Dialog open={financialDialogOpen} onOpenChange={setFinancialDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Financial Details - {selectedClient.name}</DialogTitle>
              <DialogDescription>
                Complete payment and billing history
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Payments */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  PAYMENTS
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {clientPayments.length > 0 ? (
                    clientPayments.map((payment) => (
                      <Card key={payment._id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(payment.paymentDate)}
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{payment.paymentMode || 'Cash'}</span>
                            {payment.referenceNumber && (
                              <span className="text-muted-foreground">
                                REF: {payment.referenceNumber}
                              </span>
                            )}
                          </div>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground">{payment.notes}</p>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No payments recorded</p>
                  )}
                </div>
              </div>

              {/* Right: Bills/Sales */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  BILLS
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {clientTransactions.length > 0 ? (
                    clientTransactions.map((sale) => (
                      <Card key={sale._id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">
                              {formatDate(sale.createdAt)}
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(sale.totalAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              Invoice #{sale.invoiceNumber || sale._id.slice(-6)}
                            </span>
                            <Badge
                              variant={
                                sale.paymentStatus === 'paid' ? 'default' :
                                  sale.paymentStatus === 'partial' ? 'secondary' :
                                    'destructive'
                              }
                              className="text-xs"
                            >
                              {sale.paymentStatus?.toUpperCase() || 'PENDING'}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No bills found</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Client Payment Dialog */}
        <Dialog open={clientPaymentDialogOpen} onOpenChange={setClientPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment - {selectedClient.name}</DialogTitle>
              <DialogDescription>
                Record a payment for this client. Payment will be automatically allocated across unpaid bills.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitClientPayment} className="space-y-4">
              {/* Summary Info */}
              <div className="bg-muted p-3 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Receivable:</span>
                  <span className="font-semibold text-orange-600">{formatCurrency(selectedClient.currentCredit || 0)}</span>
                </div>
                {selectedClient.overpaidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Overpaid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedClient.overpaidAmount)}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Amount (₹) *</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  onWheel={(e) => e.target.blur()}
                  required
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <Label htmlFor="payment-mode">Payment Mode *</Label>
                <Select value={paymentForm.paymentMode} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMode: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment-date">Payment Date *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  required
                />
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference-number">Reference Number</Label>
                <Input
                  id="reference-number"
                  placeholder="Transaction ID, Cheque No, etc."
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="payment-notes">Notes</Label>
                <Input
                  id="payment-notes"
                  placeholder="Additional notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submittingPayment} className="flex-1">
                  {submittingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setClientPaymentDialogOpen(false)} disabled={submittingPayment}>
                  Cancel
                </Button>
              </div>
            </form>
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
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database and relationships
          </p>
        </div>

        <div className="flex gap-3">
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Client Data
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>
                  Add a new client to your customer database.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Client Name *</Label>
                  <Input
                    id="client-name"
                    type="text"
                    placeholder="ABC Dairy Farm"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@abcdairy.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Farm Road, Village, District"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    type="text"
                    placeholder="Additional notes about the client"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Client'
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
              <DialogTitle>Export Client Data</DialogTitle>
              <DialogDescription>
                Export transaction data for a specific client within a date range.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-client">Client Name *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="export-client"
                    type="text"
                    placeholder="Search or type client name"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value)
                      setExportForm({ ...exportForm, clientName: e.target.value })
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                    className="pl-8"
                    required
                  />
                  {showClientDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredExportClients.length > 0 ? (
                        filteredExportClients.map((client) => (
                          <div
                            key={client._id}
                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                            onClick={() => handleClientSelect(client.name)}
                          >
                            {client.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted-foreground">
                          No clients found. Type to search.
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
                    setClientSearch('')
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

      {/* Clients Table */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No clients yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Add your first client or make a sale to populate this list
            </CardDescription>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
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
                <TableHead>Client Name</TableHead>
                <TableHead>Total Purchases</TableHead>
                <TableHead>Sales Count</TableHead>
                <TableHead>Receivable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client) => (
                <TableRow key={client._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleClientClick(client)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{formatCurrency(client.totalPurchases)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{client.salesCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-orange-600">{formatCurrency(client.currentCredit || 0)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleClientClick(client)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="destructive" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(client._id, client.name)
                      }}>
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
            totalItems={clients.length}
          />
        </Card>
      )}
    </div>
  )
}

export default Clients
