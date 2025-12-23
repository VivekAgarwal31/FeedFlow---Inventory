import React, { useState, useEffect } from 'react'
import { Plus, ArrowLeftRight, Loader2, Trash2 } from 'lucide-react'
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

const StockMove = () => {
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    notes: '',
    items: [{ itemId: '', quantity: '' }]
  })

  useEffect(() => {
    fetchData()
    fetchMovements()
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

  const fetchMovements = async () => {
    try {
      const response = await stockTransactionAPI.getAll({
        type: 'stock_move',
        limit: 100
      })
      setMovements(response.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch movements:', error)
      // Don't show error toast for movements, it's not critical
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
      if (form.fromWarehouseId === form.toWarehouseId) {
        setError('Source and destination warehouses must be different')
        return
      }

      // Validate that all items have both itemId and quantity
      const hasEmptyFields = form.items.some(item => !item.itemId || !item.quantity)
      if (hasEmptyFields) {
        setError('Please fill in all item and quantity fields')
        return
      }

      await stockAPI.stockMove({
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        notes: form.notes,
        items: form.items.map(item => ({
          itemId: item.itemId,
          quantity: parseInt(item.quantity)
        }))
      })

      toast({
        title: 'Success',
        description: `Stock moved successfully for ${form.items.length} item(s)`
      })

      setForm({
        fromWarehouseId: '',
        toWarehouseId: '',
        notes: '',
        items: [{ itemId: '', quantity: '' }]
      })
      setDialogOpen(false)
      fetchData() // Refresh stock items
      fetchMovements() // Refresh movement history
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to move stock')
    } finally {
      setSubmitting(false)
    }
  }

  const getAvailableToWarehouses = () => {
    return warehouses.filter(w => w._id !== form.fromWarehouseId)
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Move</h1>
          <p className="text-muted-foreground mt-1">
            Transfer stock between warehouses
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={stockItems.length === 0 || warehouses.length < 2}>
              <Plus className="mr-2 h-4 w-4" />
              Move Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Stock</DialogTitle>
              <DialogDescription>
                Transfer stock from one warehouse to another.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from-warehouse">From Warehouse *</Label>
                  <Select value={form.fromWarehouseId} onValueChange={(value) => setForm({ ...form, fromWarehouseId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source warehouse" />
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
                  <Label htmlFor="to-warehouse">To Warehouse *</Label>
                  <Select value={form.toWarehouseId} onValueChange={(value) => setForm({ ...form, toWarehouseId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Destination warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableToWarehouses().map((warehouse) => (
                        <SelectItem key={warehouse._id} value={warehouse._id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    disabled={!form.fromWarehouseId}
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
                        disabled={!form.fromWarehouseId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={form.fromWarehouseId ? "Select item" : "Select from warehouse first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {stockItems
                            .filter(stockItem => !form.fromWarehouseId || stockItem.warehouseId?._id === form.fromWarehouseId || stockItem.warehouseId === form.fromWarehouseId)
                            .map((stockItem) => (
                              <SelectItem key={stockItem._id} value={stockItem._id}>
                                {stockItem.itemName} (Available: {stockItem.quantity} bags)
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

                {form.fromWarehouseId && stockItems.filter(item => item.warehouseId?._id === form.fromWarehouseId || item.warehouseId === form.fromWarehouseId).length === 0 && (
                  <p className="text-sm text-muted-foreground">No items in this warehouse</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Reason for transfer..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    'Move Stock'
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

      {/* Requirements Alert */}
      {(stockItems.length === 0 || warehouses.length < 2) && (
        <Alert>
          <AlertDescription>
            {stockItems.length === 0 && 'You need stock items to move. '}
            {warehouses.length < 2 && 'You need at least 2 warehouses to transfer stock between them.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Current Stock by Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle>Stock by Warehouse</CardTitle>
          <CardDescription>
            Current stock distribution across warehouses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-2" />
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

      {/* Movement History */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
          <CardDescription>
            Recent stock transfers between warehouses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No stock movements yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement._id}>
                    <TableCell>{formatDate(movement.transactionDate || movement.createdAt)}</TableCell>
                    <TableCell className="font-medium">
                      {movement.itemName || 'Unknown Item'}
                    </TableCell>
                    <TableCell>{movement.warehouseName || 'Unknown'}</TableCell>
                    <TableCell>{movement.toWarehouseName || 'Unknown'}</TableCell>
                    <TableCell className="font-mono">{movement.quantity} bags</TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.notes || '-'}
                    </TableCell>
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

export default StockMove
