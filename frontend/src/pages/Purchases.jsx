import React, { useState, useEffect } from 'react'
import { Plus, ShoppingCart, Loader2, Search, Eye, Trash2 } from 'lucide-react'
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
import { Badge } from '../components/ui/badge'
import { Pagination } from '../components/ui/Pagination'

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
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const [form, setForm] = useState({
    supplierName: '',
    items: [],
    notes: ''
  })

  const [currentItem, setCurrentItem] = useState({
    warehouseId: '',
    stockItemId: '',
    itemName: '',
    quantity: '',
    unitCost: ''
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

      const stockItems = stockResponse.data.stockItems || [];
      const warehouses = warehouseResponse.data.warehouses || [];

      console.log('=== PURCHASES PAGE DEBUG ===');
      console.log('Stock items loaded:', stockItems.length);
      console.log('Stock items:', stockItems);
      console.log('Warehouses loaded:', warehouses.length);
      console.log('Warehouses:', warehouses);

      setStockItems(stockItems)
      setWarehouses(warehouses)
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
    return form.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
  }

  const calculateItemTotal = () => {
    const quantity = parseFloat(currentItem.quantity) || 0
    const unitCost = parseFloat(currentItem.unitCost) || 0
    return quantity * unitCost
  }

  const addItem = () => {
    if (!currentItem.warehouseId || !currentItem.stockItemId || !currentItem.quantity) {
      setError('Please select warehouse, item and enter quantity')
      return
    }

    const selectedStock = stockItems.find(item => item._id === currentItem.stockItemId)
    const selectedWarehouse = warehouses.find(w => w._id === currentItem.warehouseId)

    if (!selectedStock) {
      setError('Selected stock item not found')
      return
    }

    if (!selectedWarehouse) {
      setError('Selected warehouse not found')
      return
    }

    const newItem = {
      itemId: currentItem.stockItemId,
      itemName: selectedStock.itemName,
      warehouseId: currentItem.warehouseId,
      warehouseName: selectedWarehouse.name,
      quantity: parseInt(currentItem.quantity),
      unitCost: parseFloat(currentItem.unitCost) || 0
    }

    setForm({ ...form, items: [...form.items, newItem] })
    setCurrentItem({
      warehouseId: currentItem.warehouseId, // Keep same warehouse for convenience
      stockItemId: '',
      itemName: '',
      quantity: '',
      unitCost: ''
    })
    setError('')
  }

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    })
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
      if (form.items.length === 0) {
        setError('Please add at least one item')
        setSubmitting(false)
        return
      }

      const totalAmount = calculateTotal()

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
        items: form.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          quantity: item.quantity,
          costPrice: item.unitCost,
          total: item.quantity * item.unitCost
        })),
        totalAmount: totalAmount,
        notes: form.notes || `Purchase from ${supplier.name}`
      }

      console.log('=== PURCHASE DATA BEING SENT ===');
      console.log(JSON.stringify(purchaseData, null, 2));

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
        items: [],
        notes: ''
      })
      setCurrentItem({
        stockItemId: '',
        itemName: '',
        quantity: '',
        unitCost: ''
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

  const viewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase)
    setDetailsDialogOpen(true)
  }

  const deletePurchase = async (purchaseId, supplierName) => {
    if (!confirm(`Are you sure you want to delete this purchase from ${supplierName}? This will reverse the stock changes and cannot be undone.`)) {
      return
    }

    try {
      await purchaseAPI.delete(purchaseId)
      toast({
        title: 'Success',
        description: 'Purchase deleted and stock reversed successfully'
      })
      // Refresh data
      const [purchasesResponse, stockResponse] = await Promise.all([
        purchaseAPI.getAll(),
        stockAPI.getAll()
      ])
      setPurchases(purchasesResponse.data.purchases || [])
      setStockItems(stockResponse.data.stockItems || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete purchase',
        variant: 'destructive'
      })
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPurchases = filteredPurchases.slice(startIndex, startIndex + itemsPerPage)

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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                <Select value={currentItem.warehouseId} onValueChange={(value) => setCurrentItem({ ...currentItem, warehouseId: value, stockItemId: '' })}>
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
                  value={currentItem.stockItemId}
                  onValueChange={(value) => setCurrentItem({ ...currentItem, stockItemId: value })}
                  disabled={!currentItem.warehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={currentItem.warehouseId ? "Select stock item" : "Select warehouse first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      if (!currentItem.warehouseId) return null;

                      // Filter items by warehouse
                      const itemsInWarehouse = stockItems.filter(item => {
                        const itemWarehouseId = item.warehouseId?._id || item.warehouseId;
                        return itemWarehouseId === currentItem.warehouseId || itemWarehouseId?.toString() === currentItem.warehouseId;
                      });
                      const groupedItems = {};

                      itemsInWarehouse.forEach(item => {
                        if (!groupedItems[item.itemName]) {
                          groupedItems[item.itemName] = {
                            _id: item._id,
                            itemName: item.itemName,
                            warehouseQuantity: item.quantity,
                            totalQuantity: stockItems
                              .filter(i => i.itemName === item.itemName)
                              .reduce((sum, i) => sum + i.quantity, 0)
                          };
                        }
                      });

                      return Object.values(groupedItems).map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.itemName} (Warehouse: {item.warehouseQuantity} bags, Total: {item.totalQuantity} bags)
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="100"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-cost">Unit Cost (₹)</Label>
                  <Input
                    id="unit-cost"
                    type="number"
                    step="0.01"
                    placeholder="0 (optional)"
                    value={currentItem.unitCost}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitCost: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Item Total</Label>
                  <Input
                    type="text"
                    value={formatCurrency(calculateItemTotal())}
                    className="bg-muted"
                    readOnly
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
                disabled={!currentItem.stockItemId || !currentItem.quantity}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
                {form.items.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {form.items.length} item{form.items.length > 1 ? 's' : ''} added
                  </Badge>
                )}
              </Button>

              {/* Added Items List */}
              {form.items.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Items</Label>
                  <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                    {form.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.itemName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.quantity} bags
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(item.unitCost)}/bag
                          </Badge>
                          <Badge variant="default" className="text-xs bg-green-600">
                            {item.warehouseName}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{formatCurrency(item.quantity * item.unitCost)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPurchases.map((purchase) => (
                  <TableRow key={purchase._id}>
                    <TableCell>
                      {formatDate(purchase.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{purchase.supplierName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {purchase.items && purchase.items.length > 0
                          ? purchase.items.length === 1
                            ? purchase.items[0].itemName
                            : `${purchase.items[0].itemName}...`
                          : 'Unknown'}
                        {purchase.items && purchase.items.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            {purchase.items.length} items
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {purchase.items && purchase.items.length > 0
                        ? purchase.items.length === 1
                          ? purchase.items[0].warehouseName || '-'
                          : (() => {
                            const warehouses = [...new Set(purchase.items.map(i => i.warehouseName).filter(Boolean))];
                            return warehouses.length > 1
                              ? `${warehouses.length} warehouses`
                              : warehouses[0] || '-';
                          })()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {purchase.items && purchase.items.length > 0
                          ? purchase.items.reduce((sum, item) => sum + item.quantity, 0)
                          : 0} bags
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">{formatCurrency(purchase.totalAmount || 0)}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{purchase.staffName || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {purchase.items && purchase.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewPurchaseDetails(purchase)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePurchase(purchase._id, purchase.supplierName)}
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
              totalItems={filteredPurchases.length}
            />
          </>
        </Card>
      )}

      {/* Purchase Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
            <DialogDescription>
              {selectedPurchase && (
                <>
                  Purchase from {selectedPurchase.supplierName} on {formatDate(selectedPurchase.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && selectedPurchase.items && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <p className="font-medium">{selectedPurchase.supplierName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <p className="font-medium">{formatCurrency(selectedPurchase.totalAmount)}</p>
                </div>

                <div>
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <p className="font-medium">{selectedPurchase.items.reduce((sum, item) => sum + item.quantity, 0)} bags</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items Count:</span>
                  <p className="font-medium">{selectedPurchase.items.length} items</p>
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
                    {selectedPurchase.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono">{item.warehouseName}</TableCell>
                        <TableCell className="font-mono">{item.quantity} bags</TableCell>
                        <TableCell className="font-mono">{formatCurrency(item.costPrice || 0)}</TableCell>
                        <TableCell className="font-mono font-medium">{formatCurrency(item.quantity * (item.costPrice || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Purchases
