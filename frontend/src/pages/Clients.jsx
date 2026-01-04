import React, { useState, useEffect } from 'react'
import ExcelJS from 'exceljs'
import { Plus, Users, Phone, Mail, MapPin, Loader2, ArrowLeft, Calendar, Filter, Eye, Download, Search, Trash2, CreditCard, DollarSign, FileText } from 'lucide-react'
import { clientAPI, saleAPI } from '../lib/api'
import { downloadInvoiceBySale, downloadInvoiceByOrder, downloadBlob, getClientPayments, recordClientPayment } from '../lib/paymentApi'
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
  const [clientDeliveries, setClientDeliveries] = useState([])
  const [clientDirectSales, setClientDirectSales] = useState([])
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

  // Bulk import state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)

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
    notes: '',
    openingBalance: ''
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
      const salesOrders = response.data.salesOrders || []
      const directSales = response.data.directSales || []

      // Combine salesOrders and directSales for display
      const allTransactions = [
        ...salesOrders,
        ...directSales.map(ds => ({
          ...ds,
          _id: ds._id,
          orderNumber: `DS-${ds.saleNumber}`,
          orderDate: ds.saleDate,
          orderStatus: ds.saleStatus,
          isDirect: true
        }))
      ].sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))

      setClientTransactions(allTransactions)
      setClientDeliveries(response.data.deliveries || [])
      setClientDirectSales(directSales)
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
    setClientDirectSales([])
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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'default'
      case 'partially_delivered': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const handleDownloadInvoice = async (sale) => {
    try {
      const blob = await downloadInvoiceByOrder(sale._id)
      downloadBlob(blob, `Invoice-${sale.orderNumber || sale._id}.pdf`)

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully'
      })
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive'
      })
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
        const clientResponse = await clientAPI.getById(selectedClient._id)
        const salesOrders = clientResponse.data.salesOrders || []
        const directSales = clientResponse.data.directSales || []

        // Combine salesOrders and directSales for display
        const allTransactions = [
          ...salesOrders,
          ...directSales.map(ds => ({
            ...ds,
            _id: ds._id,
            orderNumber: `DS-${ds.saleNumber}`,
            orderDate: ds.saleDate,
            orderStatus: ds.saleStatus,
            isDirect: true
          }))
        ].sort((a, b) => new Date(b.orderDate || b.createdAt) - new Date(a.orderDate || a.createdAt))

        setClientTransactions(allTransactions)
        setClientDeliveries(clientResponse.data.deliveries || [])
        setClientDirectSales(directSales)

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

      const allOrders = response.data.salesOrders || []

      // Filter by date range
      const fromDate = new Date(exportForm.fromDate)
      const toDate = new Date(exportForm.toDate)
      toDate.setHours(23, 59, 59, 999) // Include the entire end date

      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.orderDate || order.createdAt)
        return orderDate >= fromDate && orderDate <= toDate
      })

      if (filteredOrders.length === 0) {
        setError('No transactions found for the selected client and date range')
        return
      }

      // Prepare transaction data
      const transactions = filteredOrders.map(order => ({
        _id: order._id,
        createdAt: order.createdAt,
        reference: `ORDER-${order._id.slice(-6)}`,
        itemName: order.items?.[0]?.itemName || 'Unknown Item',
        quantity: order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        unitPrice: order.items?.[0]?.unitPrice || 0,
        totalAmount: order.totalAmount,
        notes: `Sales Order for ${order.clientName}`
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

  // Bulk import functions
  const handleDownloadTemplate = () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Clients Template')

    // Add headers
    worksheet.columns = [
      { header: 'Name*', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'GST Number', key: 'gstNumber', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Opening Balance', key: 'openingBalance', width: 18 }
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // Add sample row
    worksheet.addRow({
      name: 'ABC Dairy Farm',
      email: 'contact@abcdairy.com',
      phone: '+91 9876543210',
      address: '123 Farm Road, Village, District',
      gstNumber: '22AAAAA0000A1Z5',
      notes: 'Regular customer',
      openingBalance: 5000
    })

    // Download file
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'clients_import_template.xlsx'
      link.click()
      window.URL.revokeObjectURL(url)
    })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImportFile(file)
      setImportResults(null)
    }
  }

  const handleBulkImport = async () => {
    if (!importFile) {
      toast({
        title: 'No file selected',
        description: 'Please select an Excel file to import',
        variant: 'destructive'
      })
      return
    }

    setImporting(true)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await clientAPI.bulkImport(formData)

      setImportResults(response.data)
      toast({
        title: 'Import Complete',
        description: response.data.message
      })

      // Refresh clients list
      await fetchClients()

      // Clear file if successful
      if (response.data.successCount > 0) {
        setImportFile(null)
      }
    } catch (error) {
      const errorData = error.response?.data
      setImportResults(errorData || { successCount: 0, failedCount: 1, errors: [{ row: 0, error: 'Failed to import' }] })
      toast({
        title: 'Import Failed',
        description: errorData?.message || 'Failed to import clients',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleViewFinancials}>
              <FileText className="mr-2 h-4 w-4" />
              View Financial Details
            </Button>
            <Button onClick={handleOpenClientPayment}>
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </div>
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
                <div>
                  <p className="text-sm text-muted-foreground">Total Receivable</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedClient.currentCredit || 0)}</p>
                </div>
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
                    <TableHead>Delivery Status</TableHead>
                    <TableHead>Payment Status</TableHead>
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
                        {/* Delivery Status - Only for order-based transactions */}
                        {!transaction.isDirect ? (
                          <Badge variant={
                            transaction.orderStatus === 'completed' ? 'default' :
                              transaction.orderStatus === 'partially_delivered' ? 'secondary' :
                                'outline'
                          }>
                            {transaction.orderStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {/* Payment Status - For all transactions */}
                        <Badge variant={
                          transaction.paymentStatus === 'paid' ? 'default' :
                            transaction.paymentStatus === 'partial' ? 'secondary' :
                              transaction.paymentStatus === 'pending' ? 'destructive' :
                                'outline'
                        }>
                          {transaction.paymentStatus?.toUpperCase() || (transaction.isDirect ? 'CASH' : 'PENDING')}
                        </Badge>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewSaleDetails(transaction)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sales Order Details - #{selectedSale?.orderNumber}</DialogTitle>
              <DialogDescription>
                Order details and delivery status
              </DialogDescription>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Order Number</Label>
                    <p className="font-mono font-medium">#{selectedSale.orderNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Order Date</Label>
                    <p className="font-medium">{formatDate(selectedSale.orderDate || selectedSale.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Customer</Label>
                    <p className="font-medium">{selectedSale.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Staff</Label>
                    <p className="font-medium">{selectedSale.staffName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <Badge variant={
                      selectedSale.paymentStatus === 'paid' ? 'default' :
                        selectedSale.paymentStatus === 'partial' ? 'secondary' :
                          selectedSale.paymentStatus === 'pending' ? 'destructive' :
                            'outline'
                    }>
                      {selectedSale.paymentStatus?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        {!selectedSale.isDirect ? (
                          <>
                            <TableHead>Ordered Qty</TableHead>
                            <TableHead>Delivered Qty</TableHead>
                            <TableHead>Remaining</TableHead>
                          </>
                        ) : (
                          <TableHead>Quantity</TableHead>
                        )}
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          {!selectedSale.isDirect ? (
                            <>
                              <TableCell className="font-mono">{item.quantity}</TableCell>
                              <TableCell className="font-mono">{item.deliveredQuantity || 0}</TableCell>
                              <TableCell className="font-mono font-bold">
                                {item.quantity - (item.deliveredQuantity || 0)}
                              </TableCell>
                            </>
                          ) : (
                            <TableCell className="font-mono">{item.quantity}</TableCell>
                          )}
                          <TableCell className="font-mono">{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                      {selectedSale.wages > 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="font-medium">Wages</TableCell>
                          <TableCell className="font-mono">{formatCurrency(selectedSale.wages)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell colSpan={5} className="font-semibold">Total Amount</TableCell>
                        <TableCell className="font-mono font-bold text-lg">{formatCurrency(selectedSale.totalAmount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Payment Status */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <p className="font-mono font-bold">{formatCurrency(selectedSale.totalAmount)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount Paid</Label>
                    <p className="font-mono font-bold text-green-600">{formatCurrency(selectedSale.amountPaid || 0)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount Due</Label>
                    <p className="font-mono font-bold text-orange-600">{formatCurrency(selectedSale.amountDue || selectedSale.totalAmount)}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedSale.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1">{selectedSale.notes}</p>
                  </div>
                )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Payments */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  PAYMENTS
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clientPayments.length > 0 ? (
                    clientPayments.map((payment) => (
                      <Card key={payment._id} className="p-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(payment.paymentDate)}
                            </span>
                            <span className="text-base font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="font-medium">{payment.paymentMode || 'Cash'}</span>
                            {payment.referenceNumber && (
                              <span className="text-muted-foreground">
                                REF: {payment.referenceNumber}
                              </span>
                            )}
                          </div>
                          {/* Allocation Details */}
                          {payment.allocations && payment.allocations.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-border/50">
                              {payment.allocations.map((allocation, idx) => (
                                <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                  <span className="text-muted-foreground/70">↳</span>
                                  <span>
                                    {formatCurrency(allocation.amountAllocated)} adjusted in Invoice #{allocation.invoiceNumber}
                                    {allocation.status === 'cleared' && <span className="text-green-600 font-medium"> - Cleared</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
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
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  BILLS
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {clientTransactions.length > 0 ? (
                    clientTransactions.map((sale) => (
                      <Card key={sale._id} className="p-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(sale.createdAt)}
                            </span>
                            <span className="text-base font-bold text-blue-600">
                              {formatCurrency(sale.totalAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs items-center">
                            <span className="font-medium">
                              Invoice #{sale.invoiceNumber || sale._id.slice(-6)}
                            </span>
                            <Badge
                              variant={
                                sale.paymentStatus === 'paid' ? 'default' :
                                  sale.paymentStatus === 'partial' ? 'secondary' :
                                    'destructive'
                              }
                              className="text-xs h-5"
                            >
                              {sale.paymentStatus?.toUpperCase() || 'PENDING'}
                            </Badge>
                          </div>
                          {/* Show payment details for partial/paid bills */}
                          {sale.paymentStatus !== 'pending' && (
                            <div className="mt-1 pt-1 border-t border-border/50">
                              <div className="text-xs text-muted-foreground flex justify-between">
                                <span>Amount Paid:</span>
                                <span className="text-green-600 font-medium">{formatCurrency(sale.amountPaid || 0)}</span>
                              </div>
                              {sale.paymentStatus === 'partial' && (
                                <div className="text-xs text-muted-foreground flex justify-between">
                                  <span>Remaining:</span>
                                  <span className="text-orange-600 font-medium">{formatCurrency(sale.amountDue || (sale.totalAmount - (sale.amountPaid || 0)))}</span>
                                </div>
                              )}
                            </div>
                          )}
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

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Import Clients
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Clients from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file to import multiple clients at once
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleDownloadTemplate} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="import-file">Select Excel File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                  />
                  {importFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {importFile.name}
                    </p>
                  )}
                </div>

                {importResults && (
                  <div className="space-y-2">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Import Results</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Successful</p>
                          <p className="text-2xl font-bold text-green-600">{importResults.successCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{importResults.failedCount}</p>
                        </div>
                      </div>
                    </div>

                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="max-h-40 overflow-y-auto">
                        <h5 className="font-semibold text-sm mb-2">Errors:</h5>
                        {importResults.errors.map((err, idx) => (
                          <div key={idx} className="text-sm text-red-600 mb-1">
                            Row {err.row}: {err.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleBulkImport} disabled={!importFile || importing} className="flex-1">
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      'Import Clients'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => { setImportDialogOpen(false); setImportFile(null); setImportResults(null); }}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="opening-balance">Opening Balance (₹)</Label>
                    <Input
                      id="opening-balance"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.openingBalance}
                      onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Enter existing receivables (if any)</p>
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
