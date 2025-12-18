import React, { useState, useEffect } from 'react'
import { Plus, Warehouse, MapPin, Loader2, Trash2, Eye, Package } from 'lucide-react'
import { warehouseAPI, stockAPI } from '../lib/api'
import { formatDate } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { useToast } from '../hooks/use-toast'

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warehouseToDelete, setWarehouseToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [warehouseDetailDialogOpen, setWarehouseDetailDialogOpen] = useState(false)
  const [selectedWarehouseForDetail, setSelectedWarehouseForDetail] = useState(null)
  const [stockItems, setStockItems] = useState([])
  const { toast } = useToast()

  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: ''
  })

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const [warehousesResponse, stockResponse] = await Promise.all([
        warehouseAPI.getAll(),
        stockAPI.getAll()
      ])
      setWarehouses(warehousesResponse.data.warehouses)
      setStockItems(stockResponse.data.stockItems || [])
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load warehouses',
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
      const warehouseData = {
        name: form.name,
        location: form.location,
        capacity: form.capacity ? parseFloat(form.capacity) : undefined
      }

      await warehouseAPI.create(warehouseData)

      toast({
        title: 'Success',
        description: 'Warehouse created successfully'
      })

      setForm({ name: '', location: '', capacity: '' })
      setDialogOpen(false)
      fetchWarehouses() // Refresh list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create warehouse')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteClick = (warehouse) => {
    setWarehouseToDelete(warehouse)
    setError('') // Clear any previous errors
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!warehouseToDelete) return

    setDeleting(true)
    try {
      await warehouseAPI.delete(warehouseToDelete._id)

      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully'
      })

      setDeleteDialogOpen(false)
      setWarehouseToDelete(null)
      fetchWarehouses() // Refresh list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete warehouse')
    } finally {
      setDeleting(false)
    }
  }

  // Get all stock items in a specific warehouse
  const getItemsInWarehouse = (warehouseId) => {
    // Filter stock items by warehouse ID
    return stockItems.filter(item => item.warehouseId === warehouseId || item.warehouseId?._id === warehouseId)
  }

  // Handle opening warehouse detail dialog
  const openWarehouseDetailDialog = (warehouse) => {
    setSelectedWarehouseForDetail(warehouse)
    setWarehouseDetailDialogOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your warehouse locations
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Warehouse</DialogTitle>
              <DialogDescription>
                Create a new warehouse location for your inventory.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse-name">Warehouse Name *</Label>
                <Input
                  id="warehouse-name"
                  type="text"
                  placeholder="Main Warehouse"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse-location">Location</Label>
                <Input
                  id="warehouse-location"
                  type="text"
                  placeholder="123 Industrial Area, City"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse-capacity">Capacity (bags)</Label>
                <Input
                  id="warehouse-capacity"
                  type="number"
                  step="1"
                  placeholder="1000"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
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
                    'Add Warehouse'
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

      {/* Warehouses Table */}
      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Warehouse className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No warehouses yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Get started by adding your first warehouse
            </CardDescription>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Warehouse
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
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse._id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-primary" />
                      <span className="font-medium">{warehouse.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {warehouse.location ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{warehouse.location}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {warehouse.capacity ? (
                      <span>{warehouse.capacity} bags</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(warehouse.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openWarehouseDetailDialog(warehouse)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(warehouse)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Warehouse
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Warehouse</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{warehouseToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Warehouse
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warehouse Detail Dialog */}
      <Dialog open={warehouseDetailDialogOpen} onOpenChange={setWarehouseDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedWarehouseForDetail?.name} - Stock Inventory
            </DialogTitle>
            <DialogDescription>
              View all items and their quantities in this warehouse
            </DialogDescription>
          </DialogHeader>

          {selectedWarehouseForDetail && (
            <div className="space-y-4">
              {/* Warehouse Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Warehouse Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Warehouse Name</p>
                      <p className="text-xl font-bold">{selectedWarehouseForDetail.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-lg font-semibold">{selectedWarehouseForDetail.location || 'No location'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Capacity</p>
                      <p className="text-lg font-semibold">{selectedWarehouseForDetail.capacity ? `${selectedWarehouseForDetail.capacity} bags` : 'No limit'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="text-lg font-semibold">{getItemsInWarehouse(selectedWarehouseForDetail._id).length} items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Items in Warehouse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Stock Items in Warehouse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Item Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Bag Size</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getItemsInWarehouse(selectedWarehouseForDetail._id).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.category?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.itemCategory ? (
                              <span className="text-sm bg-muted px-2 py-1 rounded-md">{item.itemCategory}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono ${item.quantity === 0 ? 'text-red-500 font-bold' : ''}`}>
                              {item.quantity} bags
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{item.bagSize} kg</span>
                          </TableCell>
                          <TableCell>
                            {item.quantity === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : item.quantity <= item.lowStockAlert ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">Low Stock</Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 border-green-600">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setWarehouseDetailDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Warehouses
