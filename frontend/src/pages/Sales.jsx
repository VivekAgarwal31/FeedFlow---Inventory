import React, { useState, useEffect } from 'react'
import { Plus, TrendingUp, Loader2, Trash2, Search, X, Eye, Download, DollarSign } from 'lucide-react'
import { saleAPI, stockAPI, warehouseAPI, clientAPI } from '../lib/api'
import { downloadInvoiceBySale } from '../lib/paymentApi'
import { formatCurrency, formatDate } from '../lib/utils'
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
import PaymentRecorder from '../components/PaymentRecorder'

const Sales = () => {
  const [sales, setSales] = useState([])
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const { toast } = useToast()

  const [form, setForm] = useState({
    clientName: '',
    items: [],
    wages: 0
  })

  const [currentItem, setCurrentItem] = useState({
    stockItemId: '',
    warehouseId: '',
    quantity: '',
    unitPrice: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [salesResponse, stockResponse, warehousesResponse, clientsResponse] = await Promise.all([
        saleAPI.getAll({ page: 1, limit: 100 }),
        stockAPI.getAll(),
        warehouseAPI.getAll(),
        clientAPI.getAll()
      ])

      setSales(salesResponse.data.sales || [])
      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehousesResponse.data.warehouses || [])
      setClients(clientsResponse.data.clients || [])

      // Calculate total revenue
      const revenue = (salesResponse.data.sales || []).reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
      setTotalRevenue(revenue)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStockItemChange = (itemId) => {
    const selectedItem = stockItems.find(item => item._id === itemId)
    setCurrentItem({
      ...currentItem,
      stockItemId: itemId,  // Use stockItemId for form state
      itemName: selectedItem?.itemName || '',
      unitPrice: selectedItem ? selectedItem.sellingPrice.toString() : ''
    })
  }

  const calculateItemTotal = () => {
    const quantity = parseFloat(currentItem.quantity) || 0
    const unitPrice = parseFloat(currentItem.unitPrice) || 0
    return quantity * unitPrice
  }

  const calculateSaleTotal = () => {
    const itemsTotal = form.items.reduce((sum, item) => sum + item.total, 0)
    const wages = parseFloat(form.wages) || 0
    return itemsTotal + wages
  }

  const addItemToSale = () => {
    if (!currentItem.stockItemId || !currentItem.warehouseId || !currentItem.quantity || !currentItem.unitPrice) {
      setError('Please fill all item details including warehouse')
      return
    }

    const selectedStock = stockItems.find(item => item._id === currentItem.stockItemId)
    if (!selectedStock) {
      setError('Selected stock item not found')
      return
    }

    const selectedWarehouse = warehouses.find(wh => wh._id === currentItem.warehouseId)
    if (!selectedWarehouse) {
      setError('Selected warehouse not found')
      return
    }

    // Check if there's enough stock - each stock item belongs to one warehouse
    if (selectedStock.warehouseId._id !== currentItem.warehouseId && selectedStock.warehouseId !== currentItem.warehouseId) {
      setError('This item is not available in the selected warehouse')
      return
    }

    if (parseInt(currentItem.quantity) > selectedStock.quantity) {
      setError(`Insufficient stock quantity. Available: ${selectedStock.quantity} bags`)
      return
    }

    // Check if item already exists in the sale
    const existingItemIndex = form.items.findIndex(item => item.stockItemId === currentItem.stockItemId)

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...form.items]
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: parseInt(currentItem.quantity),
        unitPrice: parseFloat(currentItem.unitPrice),
        total: parseInt(currentItem.quantity) * parseFloat(currentItem.unitPrice)
      }
      setForm({ ...form, items: updatedItems })
    } else {
      // Add new item
      const newItem = {
        itemId: currentItem.stockItemId,  // Use itemId to match backend
        itemName: selectedStock.itemName,
        quantity: parseInt(currentItem.quantity),
        unitPrice: parseFloat(currentItem.unitPrice),  // Use unitPrice to match backend
        warehouseId: currentItem.warehouseId,
        warehouseName: selectedWarehouse.name,
        total: parseInt(currentItem.quantity) * parseFloat(currentItem.unitPrice)
      }
      setForm({ ...form, items: [...form.items, newItem] })
    }

    // Reset current item
    setCurrentItem({
      stockItemId: '',
      warehouseId: '',
      quantity: '',
      unitPrice: ''
    })
    setError('')
  }

  const removeItemFromSale = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index)
    setForm({ ...form, items: updatedItems })
  }

  const handleClientSelect = (clientName) => {
    setForm({ ...form, clientName })
    setClientSearch(clientName)
    setShowClientDropdown(false)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (!form.clientName.trim()) {
        setError('Client name is required')
        setSubmitting(false)
        return
      }

      if (form.items.length === 0) {
        setError('Please add at least one item to the sale')
        setSubmitting(false)
        return
      }

      // Prepare sale data for MongoDB - match backend expectations
      const totalAmount = calculateSaleTotal()

      const saleData = {
        clientName: form.clientName,
        items: form.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          quantity: item.quantity,
          sellingPrice: item.unitPrice,  // Sale model expects sellingPrice
          total: item.total  // Sale model expects total
        })),
        wages: parseFloat(form.wages) || 0,
        totalAmount,
        paymentStatus: 'pending',
        paymentMethod: 'cash'
      }

      await saleAPI.create(saleData)

      toast({
        title: 'Success',
        description: 'Sale created successfully'
      })

      // Reset form
      setForm({
        clientName: '',
        items: [],
        wages: 0
      })
      setCurrentItem({
        itemId: '',
        itemName: '',
        quantity: '',
        sellingPrice: ''
      })
      setClientSearch('')
      setDialogOpen(false)
      fetchData() // Refresh data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create sale'
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
    setDetailsDialogOpen(true)
  }

  const deleteSale = async (saleId, saleName) => {
    if (!confirm(`Are you sure you want to delete this sale to ${saleName}? This will reverse the stock changes and cannot be undone.`)) {
      return
    }

    try {
      await saleAPI.delete(saleId)
      toast({
        title: 'Success',
        description: 'Sale deleted and stock reversed successfully'
      })
      fetchData() // Refresh data
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete sale',
        variant: 'destructive'
      })
    }
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

  const handleRecordPayment = (sale) => {
    setSelectedSaleForPayment(sale)
    setPaymentDialogOpen(true)
  }

  const handlePaymentRecorded = () => {
    fetchData() // Refresh sales data
  }

  // Calculate pagination
  const totalPages = Math.ceil(sales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSales = sales.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground mt-1">
            Record sales transactions and manage customer orders
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={stockItems.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
              <DialogDescription>
                Add multiple items to create a comprehensive sale transaction.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Client Name *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="client"
                      placeholder="Search or enter client name..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value)
                        setForm({ ...form, clientName: e.target.value })
                        setShowClientDropdown(true)
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="pl-8"
                    />
                  </div>

                  {showClientDropdown && clientSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
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
                          No existing clients found. Type to create new client.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Item Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Item to Sale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouse">Warehouse</Label>
                      <Select value={currentItem.warehouseId} onValueChange={(value) => setCurrentItem({ ...currentItem, warehouseId: value, stockItemId: '' })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse._id} value={warehouse._id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stock-item">Stock Item</Label>
                      <Select
                        value={currentItem.stockItemId}
                        onValueChange={handleStockItemChange}
                        disabled={!currentItem.warehouseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {stockItems
                            .filter(item =>
                              item.quantity > 0 &&
                              (!currentItem.warehouseId || item.warehouseId._id === currentItem.warehouseId)
                            )
                            .map((item) => (
                              <SelectItem key={item._id} value={item._id}>
                                {item.itemName} (Available: {item.quantity})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="10"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit-price">Unit Price (₹)</Label>
                      <Input
                        id="unit-price"
                        type="number"
                        step="0.01"
                        placeholder="1800"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Item Total</Label>
                      <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                        <span className="font-mono font-medium">
                          {formatCurrency(calculateItemTotal())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={addItemToSale}
                    disabled={!currentItem.warehouseId || !currentItem.stockItemId || !currentItem.quantity || !currentItem.unitPrice}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              {/* Items in Sale */}
              {form.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Items in Sale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-sm">{item.warehouseName}</TableCell>
                            <TableCell className="font-mono">{item.quantity} bags</TableCell>
                            <TableCell className="font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItemFromSale(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="font-medium">Items Subtotal</TableCell>
                          <TableCell className="font-mono font-bold">
                            {formatCurrency(form.items.reduce((sum, item) => sum + item.total, 0))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} className="font-medium">Wages</TableCell>
                          <TableCell className="font-mono">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={form.wages}
                              onChange={(e) => setForm({ ...form, wages: e.target.value })}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} className="font-medium">Total Sale Amount</TableCell>
                          <TableCell className="font-mono font-bold text-lg">
                            {formatCurrency(calculateSaleTotal())}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting || form.items.length === 0}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Sale...
                    </>
                  ) : (
                    `Create Sale - ${formatCurrency(calculateSaleTotal())}`
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

      {/* Revenue Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Stock Alert */}
      {stockItems.length === 0 && (
        <Alert>
          <AlertDescription>
            No stock items available. Please add stock items first to create sales.
          </AlertDescription>
        </Alert>
      )}

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Latest sales transactions and customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No sales recorded yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell className="font-medium">{sale.clientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sale.items && sale.items.length > 0
                            ? sale.items.length === 1
                              ? sale.items[0].itemName
                              : `${sale.items[0].itemName}...`
                            : 'Unknown'}
                          {sale.items && sale.items.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {sale.items.length} items
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.items && sale.items.length > 0
                          ? sale.items.length === 1
                            ? sale.items[0].warehouseName || '-'
                            : (() => {
                              const warehouses = [...new Set(sale.items.map(i => i.warehouseName).filter(Boolean))];
                              return warehouses.length > 1
                                ? `${warehouses.length} warehouses`
                                : warehouses[0] || '-';
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {sale.items && sale.items.length > 0
                          ? `${sale.items.reduce((sum, item) => sum + item.quantity, 0)} bags`
                          : '0 bags'}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{sale.staffName || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(sale)}
                            title="Download Invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {sale.paymentStatus !== 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRecordPayment(sale)}
                              title="Record Payment"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          {sale.items && sale.items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewSaleDetails(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSale(sale._id, sale.clientName)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                totalItems={sales.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Sale Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              {selectedSale && (
                <>
                  Sale to {selectedSale.clientName} on {formatDate(selectedSale.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && selectedSale.items && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <p className="font-medium">{selectedSale.clientName}</p>
                </div>
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

      {/* Payment Recorder Dialog */}
      {selectedSaleForPayment && (
        <PaymentRecorder
          open={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false)
            setSelectedSaleForPayment(null)
          }}
          transaction={selectedSaleForPayment}
          transactionType="sale"
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  )
}

export default Sales
