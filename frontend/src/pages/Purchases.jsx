import React, { useState, useEffect } from 'react'
import { Plus, ShoppingCart, Loader2, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'
import { purchaseAPI, supplierAPI, stockAPI, warehouseAPI } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'

const Purchases = () => {
  const [purchases, setPurchases] = useState([])
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [form, setForm] = useState({
    supplierName: '',
    warehouseId: '',
    stockItemId: '',
    quantity: '',
    unitCost: '',
    referenceNumber: '',
    notes: ''
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Load data from MongoDB API
      const [stockResponse, warehouseResponse, supplierResponse, purchaseResponse] = await Promise.all([
        stockAPI.getAll(),
        warehouseAPI.getAll(),
        supplierAPI.getAll(),
        purchaseAPI.getAll()
      ])

      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehouseResponse.data.warehouses || [])
      setSuppliers(supplierResponse.data.suppliers || [])
      setPurchases(purchaseResponse.data.purchases || [])

      // Calculate total purchases
      const totalPurchaseAmount = (purchaseResponse.data.purchases || []).reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0)
      setTotalPurchases(totalPurchaseAmount)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load purchase data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    const quantity = parseFloat(form.quantity) || 0
    const unitCost = parseFloat(form.unitCost) || 0
    return quantity * unitCost
  }

  const handleSupplierSelect = (supplierName) => {
    setForm({ ...form, supplierName })
    setSupplierSearch(supplierName)
    setShowSupplierDropdown(false)
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const selectedStock = stockItems.find(item => item._id === form.stockItemId)
      const selectedWarehouse = warehouses.find(w => w._id === form.warehouseId)

      if (!selectedStock) {
        setError('Selected stock item not found')
        setSubmitting(false)
        return
      }

      if (!selectedWarehouse) {
        setError('Selected warehouse not found')
        setSubmitting(false)
        return
      }

      const quantity = parseInt(form.quantity)
      const unitPrice = parseFloat(form.unitCost)
      const totalAmount = quantity * unitPrice

      // Find or create supplier
      let supplier = suppliers.find(s => s.name.toLowerCase() === form.supplierName.toLowerCase())
      if (!supplier) {
        // Create new supplier
        const supplierResponse = await supplierAPI.create({
          name: form.supplierName,
          contactPerson: '',
          phone: '',
          email: '',
          address: ''
        })
        supplier = supplierResponse.data.supplier
        setSuppliers(prev => [...prev, supplier])
      }

      // Create purchase via API
      const purchaseData = {
        supplierId: supplier._id,
        supplierName: supplier.name,
        warehouseId: form.warehouseId,
        warehouseName: selectedWarehouse.name,
        items: [{
          itemId: selectedStock._id,
          itemName: selectedStock.itemName,
          quantity: quantity,
          unitPrice: unitPrice
        }],
        totalAmount: totalAmount,
        notes: form.notes || `Purchase from ${supplier.name}`
      }

      const response = await purchaseAPI.create(purchaseData)
      const newPurchase = response.data.purchase

      // Update local state
      setPurchases(prev => [newPurchase, ...prev])
      setTotalPurchases(prev => prev + totalAmount)

      // Refresh stock items to get updated quantities
      const stockResponse = await stockAPI.getAll()
      setStockItems(stockResponse.data.stockItems || [])

      toast({
        title: 'Success',
        description: `Purchase recorded successfully for ${formatCurrency(totalAmount)}`,
      })

      setForm({
        supplierName: '',
        warehouseId: '',
        stockItemId: '',
        quantity: '',
        unitCost: '',
        referenceNumber: '',
        notes: ''
      })
      setSupplierSearch('')
      setDialogOpen(false)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to record purchase'
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

  const filteredPurchases = purchases.filter(purchase =>
    purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your purchase transactions
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Purchase</DialogTitle>
              <DialogDescription>
                Record a new purchase transaction and update inventory automatically.
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
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="supplier-name"
                      placeholder="Search or enter supplier name..."
                      value={supplierSearch}
                      onChange={(e) => {
                        setSupplierSearch(e.target.value)
                        setForm({ ...form, supplierName: e.target.value })
                        setShowSupplierDropdown(true)
                      }}
                      onFocus={() => setShowSupplierDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                      className="pl-8"
                      required
                    />
                  </div>

                  {showSupplierDropdown && supplierSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => (
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
                          No existing suppliers found. Type to create new supplier.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliver-to">Deliver to *</Label>
                <Select value={form.warehouseId} onValueChange={(value) => setForm({ ...form, warehouseId: value, stockItemId: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery warehouse" />
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
                <Label htmlFor="stock-item">Stock Item *</Label>
                <Select
                  value={form.stockItemId}
                  onValueChange={(value) => setForm({ ...form, stockItemId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock item" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems.map((item) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.itemName} (Current: {item.quantity} bags)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-cost">Unit Cost (₹) *</Label>
                  <Input
                    id="unit-cost"
                    type="number"
                    step="0.01"
                    placeholder="1500"
                    value={form.unitCost}
                    onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-cost">Total Cost (₹)</Label>
                <Input
                  id="total-cost"
                  type="text"
                  value={formatCurrency(calculateTotal())}
                  className="bg-muted"
                  readOnly
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Record Purchase'
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

      {/* Total Purchases Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Purchases
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(totalPurchases)}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Purchases History Table */}
      {filteredPurchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No purchases found</CardTitle>
            <CardDescription className="text-center mb-4">
              {searchTerm ? 'No purchases match your search criteria' : 'Record your first purchase to get started'}
            </CardDescription>
            {!searchTerm && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Purchase
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map((purchase) => (
                <TableRow key={purchase._id}>
                  <TableCell>
                    {formatDate(purchase.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{purchase.supplierName}</span>
                  </TableCell>
                  <TableCell>
                    {purchase.items?.[0]?.itemName || 'Unknown Item'}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{purchase.items?.[0]?.quantity || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{formatCurrency(purchase.items?.[0]?.unitPrice || 0)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium">{formatCurrency(purchase.totalAmount || 0)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

export default Purchases
