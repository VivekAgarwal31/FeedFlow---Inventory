import React, { useState, useEffect } from 'react'
import { Plus, Settings, Loader2, Trash2 } from 'lucide-react'
import { stockAPI, warehouseAPI, stockTransactionAPI } from '../lib/api'
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

const StockAdjust = () => {
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [form, setForm] = useState({
    warehouseId: '',
    reason: 'audit',
    notes: '',
    items: [{ itemId: '', adjustmentType: 'increase', quantity: '' }]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stockResponse, warehousesResponse, adjustmentsResponse] = await Promise.all([
        stockAPI.getAll(),
        warehouseAPI.getAll(),
        stockTransactionAPI.getAll({ type: 'stock_adjust' })
      ])

      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehousesResponse.data.warehouses || [])
      setAdjustments(adjustmentsResponse.data.transactions || [])
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
      items: [...form.items, { itemId: '', adjustmentType: 'increase', quantity: '' }]
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
      // Validate that all items have all required fields
      const hasEmptyFields = form.items.some(item => !item.itemId || !item.adjustmentType || !item.quantity)
      if (hasEmptyFields) {
        setError('Please fill in all item, adjustment type, and quantity fields')
        return
      }

      await stockAPI.stockAdjust({
        warehouseId: form.warehouseId,
        reason: form.reason,
        notes: form.notes,
        items: form.items.map(item => ({
          itemId: item.itemId,
          adjustmentType: item.adjustmentType,
          quantity: parseInt(item.quantity)
        }))
      })

      toast({
        title: 'Success',
        description: `Stock adjusted successfully for ${form.items.length} item(s)`
      })

      setForm({
        warehouseId: '',
        reason: 'audit',
        notes: '',
        items: [{ itemId: '', adjustmentType: 'increase', quantity: '' }]
      })
      setDialogOpen(false)
      fetchData() // Refresh stock items
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to adjust stock')
    } finally {
      setSubmitting(false)
    }
  }

  const getAdjustmentBadge = (type) => {
    return type === 'increase' ? (
      <Badge className="bg-success/10 text-success border-success/20">
        +{type}
      </Badge>
    ) : (
      <Badge variant="destructive">
        -{type}
      </Badge>
    )
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
        itemId: item._id // Store the actual item ID for this warehouse
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjust</h1>
          <p className="text-muted-foreground mt-1">
            Adjust stock quantities for corrections and audits
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={stockItems.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stock Adjustment</DialogTitle>
              <DialogDescription>
                Adjust stock quantity for corrections, audits, or other reasons.
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
                                {stockItem.itemName} (Current: {stockItem.quantity} bags)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32 space-y-2">
                      <Select
                        value={item.adjustmentType}
                        onValueChange={(value) => updateItemRow(index, 'adjustmentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="increase">+</SelectItem>
                          <SelectItem value="decrease">-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-24 space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select value={form.reason} onValueChange={(value) => setForm({ ...form, reason: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audit">Physical Audit</SelectItem>
                    <SelectItem value="correction">Data Correction</SelectItem>
                    <SelectItem value="damage">Damage/Loss</SelectItem>
                    <SelectItem value="found">Found Stock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                      Adjusting...
                    </>
                  ) : (
                    'Apply Adjustment'
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

      {/* Current Stock Items */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Items</CardTitle>
          <CardDescription>
            Select items to adjust quantities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No stock items found</p>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>

      {/* Adjustment History */}
      <Card>
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
          <CardDescription>
            Recent stock adjustments and corrections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No adjustments made yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Performed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment._id}>
                    <TableCell>{formatDate(adjustment.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {adjustment.itemName || 'Unknown Item'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{adjustment.warehouseName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={adjustment.quantity >= 0 ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}>
                          {adjustment.quantity >= 0 ? '+' : ''}{adjustment.quantity} bags
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{adjustment.reason || '-'}</TableCell>
                    <TableCell>{adjustment.staffName || 'Unknown'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StockAdjust
