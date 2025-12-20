import React, { useState, useEffect } from 'react'
import { Plus, Settings, Loader2 } from 'lucide-react'
import { stockAPI, warehouseAPI } from '../lib/api'
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
    itemId: '',
    warehouseId: '',
    newQuantity: '',
    reason: 'audit',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stockResponse, warehousesResponse] = await Promise.all([
        stockAPI.getAll(),
        warehouseAPI.getAll()
      ])

      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehousesResponse.data.warehouses || [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await stockAPI.stockAdjust({
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        newQuantity: parseInt(form.newQuantity),
        reason: form.reason,
        notes: form.notes
      })

      toast({
        title: 'Success',
        description: 'Stock adjusted successfully'
      })

      setForm({
        itemId: '',
        warehouseId: '',
        newQuantity: '',
        reason: 'audit',
        notes: ''
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
                <Select value={form.warehouseId} onValueChange={(value) => setForm({ ...form, warehouseId: value, itemId: '' })}>
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
                <Label htmlFor="stock-item">Stock Item *</Label>
                <Select
                  value={form.itemId}
                  onValueChange={(value) => setForm({ ...form, itemId: value })}
                  disabled={!form.warehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.warehouseId ? "Select stock item" : "Select warehouse first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stockItems
                      .filter(item => !form.warehouseId || item.warehouseId?._id === form.warehouseId || item.warehouseId === form.warehouseId)
                      .map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.itemName} (Current: {item.quantity} bags)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {form.warehouseId && stockItems.filter(item => item.warehouseId?._id === form.warehouseId || item.warehouseId === form.warehouseId).length === 0 && (
                  <p className="text-sm text-muted-foreground">No items in this warehouse</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adjustment-type">Adjustment Type *</Label>
                  <Select value={form.adjustmentType} onValueChange={(value) => setForm({ ...form, adjustmentType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Increase (+)</SelectItem>
                      <SelectItem value="decrease">Decrease (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => (
                  <TableRow key={adjustment._id}>
                    <TableCell>{formatDate(adjustment.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {adjustment.stockItemId?.itemName || 'Unknown Item'}
                    </TableCell>
                    <TableCell>
                      {getAdjustmentBadge(adjustment.adjustmentType)}
                    </TableCell>
                    <TableCell className="font-mono">{adjustment.quantity}</TableCell>
                    <TableCell className="font-mono">{adjustment.previousQuantity}</TableCell>
                    <TableCell className="font-mono font-medium">{adjustment.newQuantity}</TableCell>
                    <TableCell className="capitalize">{adjustment.reason}</TableCell>
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
