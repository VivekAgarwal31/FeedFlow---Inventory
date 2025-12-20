import React, { useState, useEffect } from 'react'
import { Plus, ArrowUpFromLine, Loader2 } from 'lucide-react'
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

const StockOut = () => {
  const [stockItems, setStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  const [form, setForm] = useState({
    itemId: '',
    warehouseId: '',
    quantity: '',
    reason: 'sale',
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
      await stockAPI.stockOut({
        itemId: form.itemId,
        warehouseId: form.warehouseId,
        quantity: parseInt(form.quantity),
        reason: form.reason,
        notes: form.notes
      })

      toast({
        title: 'Success',
        description: 'Stock removed successfully'
      })

      setForm({
        itemId: '',
        warehouseId: '',
        quantity: '',
        reason: 'sale',
        notes: ''
      })
      setDialogOpen(false)
      fetchData() // Refresh stock items
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove stock')
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Out</h1>
          <p className="text-muted-foreground mt-1">
            Remove stock from inventory for various reasons
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={stockItems.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Remove Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Stock</DialogTitle>
              <DialogDescription>
                Remove stock quantity from an existing item.
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
                          {item.itemName} (Available: {item.quantity} bags)
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
                  <Label htmlFor="quantity">Quantity to Remove *</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Select value={form.reason} onValueChange={(value) => setForm({ ...form, reason: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient/Client Name</Label>
                <Input
                  id="recipient"
                  type="text"
                  placeholder="ABC Dairy Farm"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  type="text"
                  placeholder="SO-2024-001"
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
                      Removing...
                    </>
                  ) : (
                    'Remove Stock'
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
            <ArrowUpFromLine className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No stock available</CardTitle>
            <CardDescription className="text-center mb-4">
              No stock items with available quantity found
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Stock Items</CardTitle>
            <CardDescription>
              Select items to remove stock quantities
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

export default StockOut
