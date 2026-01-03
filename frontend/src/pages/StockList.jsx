import React, { useState, useEffect } from 'react'
import { Plus, Package, AlertCircle, Loader2, Search, Filter, Trash2, MoreHorizontal, Eye, Warehouse, FileUp } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { stockAPI, warehouseAPI } from '../lib/api'
import { useToast } from '../hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Pagination } from '../components/ui/Pagination'
import BulkStockUpload from '../components/BulkStockUpload'

const StockList = () => {
  const [stockItems, setStockItems] = useState([])
  const [filteredStockItems, setFilteredStockItems] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [itemDetailDialogOpen, setItemDetailDialogOpen] = useState(false)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null)
  const [bulkUploadMode, setBulkUploadMode] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [form, setForm] = useState({
    itemName: '',
    category: 'finished_product',
    itemCategory: '',
    bagSize: '',
    quantity: '0',
    lowStockAlert: '10',
    initialWarehouseId: '' // For initial quantity assignment
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterStockItems()
  }, [stockItems, searchTerm, categoryFilter, itemCategoryFilter])

  const fetchData = async () => {
    try {
      // Load data from MongoDB API
      const [stockResponse, warehouseResponse] = await Promise.all([
        stockAPI.getAll(),
        warehouseAPI.getAll()
      ])

      setStockItems(stockResponse.data.stockItems || [])
      setWarehouses(warehouseResponse.data.warehouses || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load stock data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterStockItems = () => {
    let filtered = stockItems

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.itemCategory && item.itemCategory.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    // Filter by item category
    if (itemCategoryFilter !== 'all') {
      filtered = filtered.filter(item => item.itemCategory === itemCategoryFilter)
    }

    setFilteredStockItems(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Get unique item categories for filter dropdown
  const getUniqueItemCategories = () => {
    const categories = stockItems
      .map(item => item.itemCategory)
      .filter(category => category && category.trim() !== '')
    return [...new Set(categories)]
  }

  // Calculate stock distribution for a specific item across all warehouses
  const getStockDistributionForItem = (consolidatedItem) => {
    // consolidatedItem has a warehouses array with all the actual quantities
    // We need to show ALL warehouses, with quantities from the warehouses array
    return warehouses.map(warehouse => {
      const warehouseData = consolidatedItem.warehouses.find(
        wh => wh.id === warehouse._id
      )
      return {
        warehouse: warehouse,
        quantity: warehouseData ? warehouseData.quantity : 0
      }
    })
  }

  // Handle opening item detail dialog
  const openItemDetailDialog = (item) => {
    setSelectedItemForDetail(item)
    setItemDetailDialogOpen(true)
  }

  // Consolidate stock items by name, showing warehouse distribution
  const consolidateStockItems = (items) => {
    const consolidated = {}

    items.forEach(item => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Check if warehouses exist
      if (!warehouses || warehouses.length === 0) {
        setError('Please create a warehouse first before adding stock items')
        setSubmitting(false)
        return
      }

      // Validate required fields
      if (!form.itemName.trim()) {
        setError('Item name is required')
        setSubmitting(false)
        return
      }

      if (!form.bagSize || parseFloat(form.bagSize) <= 0) {
        setError('Bag size must be greater than 0')
        setSubmitting(false)
        return
      }

      // Validate initial warehouse if quantity > 0
      if (parseInt(form.quantity) > 0 && !form.initialWarehouseId) {
        setError('Please select a warehouse for the initial quantity')
        setSubmitting(false)
        return
      }

      const stockData = {
        itemName: form.itemName,
        category: form.category,
        itemCategory: form.itemCategory,
        bagSize: parseFloat(form.bagSize),
        lowStockAlert: parseInt(form.lowStockAlert),
        warehouseId: form.initialWarehouseId || warehouses[0]?._id,
        quantity: parseInt(form.quantity) || 0,
        notes: `Initial stock creation for ${form.itemName}`
      }

      // Create stock item via API
      const response = await stockAPI.create(stockData)

      const newStockItem = response.data.stockItem

      // Update local state
      setStockItems(prev => [newStockItem, ...prev])

      toast({
        title: 'Success',
        description: `Stock item "${newStockItem.itemName}" created successfully!`,
      })

      setForm({
        itemName: '',
        category: 'finished_product',
        itemCategory: '',
        bagSize: '',
        quantity: '0',
        lowStockAlert: '10',
        initialWarehouseId: ''
      })
      setDialogOpen(false)
    } catch (error) {
      console.error('Error creating stock item:', error)

      // Extract specific validation error or use generic message
      let errorMsg = 'Failed to create stock item'
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        // Show the first validation error message
        errorMsg = error.response.data.errors[0].msg
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      }

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

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    setError('')

    try {
      // For consolidated items, delete all warehouse records
      // itemToDelete.warehouses contains all the warehouse records for this item
      if (itemToDelete.warehouses && itemToDelete.warehouses.length > 0) {
        // Delete all warehouse records for this item
        await Promise.all(
          itemToDelete.warehouses.map(wh => stockAPI.delete(wh.itemId))
        )

        // Remove all warehouse records from local state
        setStockItems(prev => prev.filter(item =>
          !itemToDelete.warehouses.some(wh => wh.itemId === item._id)
        ))
      } else {
        // Fallback for non-consolidated items (shouldn't happen in current flow)
        await stockAPI.delete(itemToDelete._id)
        setStockItems(prev => prev.filter(item => item._id !== itemToDelete._id))
      }

      toast({
        title: 'Success',
        description: `Stock item "${itemToDelete.itemName}" deleted from all warehouses`,
      })

      setDeleteDialogOpen(false)
      setItemToDelete(null)
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to delete stock item'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive'
      })
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
    setError('')
  }

  const getCategoryBadge = (category) => {
    const variants = {
      raw_material: 'secondary',
      finished_product: 'default',
      packaging: 'outline'
    }

    return (
      <Badge variant={variants[category]}>
        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const getStatusBadge = (item) => {
    // Use totalQuantity for consolidated items, fallback to quantity for non-consolidated
    const totalQuantity = item.totalQuantity !== undefined ? item.totalQuantity : (item.quantity || 0)

    if (totalQuantity < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Negative Stock
        </Badge>
      )
    }

    if (totalQuantity === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )
    }

    if (totalQuantity <= item.lowStockAlert) {
      return (
        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
          <AlertCircle className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
        In Stock
      </Badge>
    )
  }

  // Calculate pagination
  const consolidatedItems = consolidateStockItems(filteredStockItems)
  const totalPages = Math.ceil(consolidatedItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = consolidatedItems.slice(startIndex, startIndex + itemsPerPage)

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
          <h1 className="text-3xl font-bold tracking-tight">Stock Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your stock items and inventory
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setBulkUploadMode(false)
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Stock Item</DialogTitle>
              <DialogDescription>
                Add a new item to your inventory with pricing and stock details.
              </DialogDescription>
            </DialogHeader>

            {/* Mode Toggle */}
            {!bulkUploadMode && (
              <div className="flex gap-2 pb-4 border-b">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkUploadMode(true)}
                  className="flex-1"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Add via File
                </Button>
              </div>
            )}

            {/* Bulk Upload Mode */}
            {bulkUploadMode ? (
              <BulkStockUpload
                warehouses={warehouses}
                onSuccess={() => {
                  fetchData()
                  setBulkUploadMode(false)
                  setDialogOpen(false)
                }}
                onCancel={() => {
                  setBulkUploadMode(false)
                  setDialogOpen(false)
                }}
              />
            ) : (
              <>
                {/* Manual Entry Mode */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-name">Item Name *</Label>
                      <Input
                        id="item-name"
                        type="text"
                        placeholder="Premium Product"
                        value={form.itemName}
                        onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raw_material">Raw Material</SelectItem>
                          <SelectItem value="finished_product">Finished Product</SelectItem>
                          <SelectItem value="packaging">Packaging</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="item-category">Item Category (Optional)</Label>
                      <Input
                        id="item-category"
                        type="text"
                        placeholder="e.g., Premium Brand, Economy, Organic"
                        value={form.itemCategory}
                        onChange={(e) => setForm({ ...form, itemCategory: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use this to group similar items by brand, quality, or type
                      </p>
                    </div>


                    <div className="space-y-2">
                      <Label htmlFor="bag-size">Bag Size (kg) *</Label>
                      <Input
                        id="bag-size"
                        type="number"
                        step="0.01"
                        placeholder="25"
                        value={form.bagSize}
                        onChange={(e) => setForm({ ...form, bagSize: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Initial Quantity (bags)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="0 (can be added later via Stock In)"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave as 0 to add stock later using Stock In
                      </p>
                    </div>

                    {/* Show warehouse selection only if quantity > 0 */}
                    {parseInt(form.quantity) > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="initial-warehouse">Assign Initial Quantity To *</Label>
                        <Select value={form.initialWarehouseId} onValueChange={(value) => setForm({ ...form, initialWarehouseId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse for initial stock" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse._id} value={warehouse._id}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Choose which warehouse will receive the initial quantity
                        </p>
                      </div>
                    )}


                    <div className="space-y-2">
                      <Label htmlFor="low-stock">Low Stock Alert</Label>
                      <Input
                        id="low-stock"
                        type="number"
                        placeholder="10"
                        value={form.lowStockAlert}
                        onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Stock Item'
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
              </>
            )}
          </DialogContent>

        </Dialog>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      {stockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="finished_product">Finished Product</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-category-filter">Item Category</Label>
                <Select value={itemCategoryFilter} onValueChange={setItemCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Item Categories</SelectItem>
                    {getUniqueItemCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Results</Label>
                <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                  <span className="text-sm font-medium">
                    {consolidatedItems.length} items
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Items Table */}
      {stockItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No stock items yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Add your first stock item to get started
            </CardDescription>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stock Item
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : filteredStockItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No items match your filters</CardTitle>
            <CardDescription className="text-center mb-4">
              Try adjusting your search terms or filters
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Item Category</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Bag Size</TableHead>
                <TableHead>Warehouses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">{item.itemName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(item.category)}
                  </TableCell>
                  <TableCell>
                    {item.itemCategory ? (
                      <span className="text-sm bg-muted px-2 py-1 rounded-md">{item.itemCategory}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`font-mono font-semibold ${item.totalQuantity < 0 ? 'text-red-600' : 'text-foreground'
                      }`}>
                      {item.totalQuantity} bags
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{item.bagSize} kg</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.warehouses.map((wh, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {wh.name}: {wh.quantity}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openItemDetailDialog(item)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(item)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            totalItems={consolidatedItems.length}
          />
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Stock Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.itemName}</strong>?
              <br />
              <br />
              This will permanently remove the item from <strong>all warehouses</strong> ({itemToDelete?.warehouses?.length || 0} warehouse{itemToDelete?.warehouses?.length !== 1 ? 's' : ''}). This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
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
                  Delete Item
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
                setError('')
              }}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={itemDetailDialogOpen} onOpenChange={setItemDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedItemForDetail?.itemName} - Warehouse Distribution
            </DialogTitle>
            <DialogDescription>
              View the quantity of this item across all warehouses
            </DialogDescription>
          </DialogHeader>

          {selectedItemForDetail && (
            <div className="space-y-4">
              {/* Item Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Item Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Quantity</p>
                      <p className="text-2xl font-bold">{selectedItemForDetail.quantity || 0} bags</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bag Size</p>
                      <p className="text-lg font-semibold">{selectedItemForDetail.bagSize} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="text-lg font-semibold">{selectedItemForDetail.category?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Alert</p>
                      <p className="text-lg font-semibold">{selectedItemForDetail.lowStockAlert} bags</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warehouse Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Warehouse Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStockDistributionForItem(selectedItemForDetail).map((dist, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{dist.warehouse.name}</TableCell>
                          <TableCell>{dist.warehouse.location || 'No location'}</TableCell>
                          <TableCell>
                            <span className={`font-mono font-semibold ${dist.quantity < 0 ? 'text-red-600' :
                              dist.quantity === 0 ? 'text-muted-foreground' :
                                'text-foreground'
                              }`}>
                              {dist.quantity} bags
                            </span>
                          </TableCell>
                          <TableCell>
                            {dist.quantity < 0 ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Negative Stock
                              </Badge>
                            ) : dist.quantity === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : dist.quantity <= (selectedItemForDetail.lowStockAlert || 10) ? (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">Low Stock</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">In Stock</Badge>
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
              onClick={() => setItemDetailDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockList
