import React, { useState, useEffect } from 'react'
import { Plus, ArrowDownToLine, Loader2, Trash2 } from 'lucide-react'
import { stockAPI, warehouseAPI, supplierAPI } from '../lib/api'
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

const StockIn = () => {
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [form, setForm] = useState({
    warehouseId: '',
    reason: 'other',
    supplierId: '',
    supplierName: '',
    referenceNumber: '',
    notes: '',
    items: [{ itemId: '', quantity: '' }]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stockResponse, warehousesResponse, suppliersResponse] = await Promise.all([
        stockAPI.getAll(),
        warehouseAPI.getAll(),
        supplierAPI.getList()
      ])

      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehousesResponse.data.warehouses || [])
      setSuppliers(suppliersResponse.data.suppliers || [])
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

  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { itemId: '', quantity: '' }]
    })
  }

  const removeItemRow = (index) => {
    if (form.items.length > 1) {
      const newItems = form.items.filter((_, i) => i !== index)
      setForm({ ...form, items: newItems })
    }
  }

  const updateItemRow = (index, field, value) => {
    const newItems = [...form.items]
    newItems[index][field] = value
    setForm({ ...form, items: newItems })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Validate that all items have both itemId and quantity
      const hasEmptyFields = form.items.some(item => !item.itemId || !item.quantity)
      if (hasEmptyFields) {
        setError('Please fill in all item and quantity fields')
        return
      }

      await stockAPI.stockIn({
        warehouseId: form.warehouseId,
        supplierName: form.supplierName,
        referenceNumber: form.referenceNumber,
        notes: form.notes,
        items: form.items.map(item => ({
          itemId: item.itemId,
          quantity: parseInt(item.quantity)
        }))
      })

      toast({
        title: 'Success',
        description: `Stock added successfully for ${form.items.length} item(s)`
      })

      setForm({
        warehouseId: '',
        supplierName: '',
        referenceNumber: '',
        notes: '',
        items: [{ itemId: '', quantity: '' }]
      })
      setDialogOpen(false)
      fetchData() // Refresh stock items
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add stock')
    } finally {
      setSubmitting(false)
    }
  }

  // Consolidate stock items by name, showing warehouse distribution
  const consolidateStockItems = () => {
    const consolidated = {}

    stockItems.forEach(item => {
      const key = `${item.itemName}_${item.bagSize}_${item.category}`

      if (!consolidated[key]) {
        consolidated[key] = {
          ...item,
          totalQuantity: 0,
          warehouses: []
        }
      }

      consolidated[key].totalQuantity += item.quantity || 0
      consolidated[key].warehouses.push({
        id: item.warehouseId?._id || item.warehouseId,
        name: item.warehouseId?.name || 'Unknown',
        quantity: item.quantity || 0,
        itemId: item._id
      })
    })

    return Object.values(consolidated)
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Stock In</h1>
          <p className="text-muted-foreground mt-1">
            Add stock to existing inventory items
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={stockItems.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock In</DialogTitle>
              <DialogDescription>
                Increase stock quantity for an existing item.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select value={form.warehouseId} onValueChange={(value) => setForm({ ...form, warehouseId: value })}>
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

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItemRow}
                    disabled={!form.warehouseId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {form.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={item.itemId}
                        onValueChange={(value) => updateItemRow(index, 'itemId', value)}
                        disabled={!form.warehouseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.warehouseId ? "Select item" : "Select warehouse first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {stockItems
                            .filter(stockItem => !form.warehouseId || stockItem.warehouseId?._id === form.warehouseId || stockItem.warehouseId === form.warehouseId)
                            .map((stockItem) => (
                              <SelectItem key={stockItem._id} value={stockItem._id}>
                                {stockItem.itemName} (Current: {stockItem.quantity} bags, {stockItem.bagSize}kg)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32 space-y-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemRow(index)}
                      disabled={form.items.length === 1}
                      className="mt-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {form.warehouseId && stockItems.filter(item => item.warehouseId?._id === form.warehouseId || item.warehouseId === form.warehouseId).length === 0 && (
                  <p className="text-sm text-muted-foreground">No items in this warehouse</p>
                )}
              </div>

              {/* Reason Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select
                  value={form.reason}
                  onValueChange={(value) => {
                    setForm({
                      ...form,
                      reason: value,
                      // Clear supplier fields if switching away from purchase
                      supplierId: value === 'purchase' ? form.supplierId : '',
                      supplierName: value === 'purchase' ? form.supplierName : ''
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Supplier Dropdown */}
              {form.reason === 'purchase' && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={form.supplierId}
                    onValueChange={(value) => {
                      const supplier = suppliers.find(s => s._id === value)
                      setForm({
                        ...form,
                        supplierId: value,
                        supplierName: supplier?.name || ''
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {suppliers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No suppliers found. Please create a supplier first.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  type="text"
                  placeholder="PO-2024-001"
                  value={form.referenceNumber}
                  onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Additional notes..."
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
                    'Add Stock'
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

      {/* Stock Items Table */}
      {stockItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowDownToLine className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No stock items found</CardTitle>
            <CardDescription className="text-center mb-4">
              Create stock items first before adding stock
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Current Stock Items</CardTitle>
            <CardDescription>
              Select items to add stock quantities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Warehouses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidateStockItems().map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.category?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{item.totalQuantity} bags</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.warehouses.map((wh, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {wh.name}: {wh.quantity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StockIn
