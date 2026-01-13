import React, { useState, useEffect } from 'react'
import { Plus, ShoppingCart, Loader2, Trash2, Search, Eye, TrendingDown, Pencil } from 'lucide-react'
import { purchaseOrderAPI, stockAPI, supplierAPI } from '../lib/api'
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

const PurchaseOrders = () => {
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [stockItems, setStockItems] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [viewingOrder, setViewingOrder] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [supplierSearch, setSupplierSearch] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingOrder, setEditingOrder] = useState(null)
    const [editForm, setEditForm] = useState({ items: [], notes: '' })

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const { toast } = useToast()

    const [form, setForm] = useState({
        supplierName: '',
        items: [],
        expectedDeliveryDate: '',
        notes: ''
    })

    const [currentItem, setCurrentItem] = useState({
        stockItemId: '',
        quantity: '',
        unitPrice: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [ordersResponse, stockResponse, suppliersResponse] = await Promise.all([
                purchaseOrderAPI.getAll({ page: 1, limit: 100 }),
                stockAPI.getAll(),
                supplierAPI.getAll()
            ])

            setPurchaseOrders(ordersResponse.data.purchaseOrders || [])
            // Consolidate stock items by name and bag size
            const rawStockItems = stockResponse.data.stockItems || []
            const consolidated = {}
            rawStockItems.forEach(item => {
                const key = `${item.itemName}_${item.bagSize}`
                if (!consolidated[key]) {
                    consolidated[key] = {
                        ...item,
                        warehouses: []
                    }
                }
                consolidated[key].warehouses.push({
                    id: item.warehouseId?._id || item.warehouseId,
                    name: item.warehouseId?.name || 'Unknown',
                    quantity: item.quantity || 0,
                    itemId: item._id
                })
            })
            setStockItems(Object.values(consolidated))
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

    const handleStockItemChange = (itemId) => {
        const selectedItem = stockItems.find(item => item._id === itemId)
        setCurrentItem({
            ...currentItem,
            stockItemId: itemId,
            itemName: selectedItem?.itemName || '',
            unitPrice: selectedItem ? selectedItem.costPrice.toString() : ''
        })
    }

    const calculateItemTotal = () => {
        const quantity = parseFloat(currentItem.quantity) || 0
        const unitPrice = parseFloat(currentItem.unitPrice) || 0
        return quantity * unitPrice
    }

    const calculateOrderTotal = () => {
        return form.items.reduce((sum, item) => sum + item.total, 0)
    }

    const addItemToOrder = () => {
        if (!currentItem.stockItemId || !currentItem.quantity || !currentItem.unitPrice) {
            setError('Please fill all item details')
            return
        }

        const selectedStock = stockItems.find(item => item._id === currentItem.stockItemId)
        if (!selectedStock) {
            setError('Selected stock item not found')
            return
        }

        const existingItemIndex = form.items.findIndex(item => item.stockItemId === currentItem.stockItemId)

        if (existingItemIndex >= 0) {
            const updatedItems = [...form.items]
            updatedItems[existingItemIndex] = {
                ...updatedItems[existingItemIndex],
                quantity: parseInt(currentItem.quantity),
                unitPrice: parseFloat(currentItem.unitPrice),
                total: parseInt(currentItem.quantity) * parseFloat(currentItem.unitPrice)
            }
            setForm({ ...form, items: updatedItems })
        } else {
            const newItem = {
                itemId: currentItem.stockItemId,
                itemName: selectedStock.itemName,
                quantity: parseInt(currentItem.quantity),
                costPrice: parseFloat(currentItem.unitPrice),
                total: parseInt(currentItem.quantity) * parseFloat(currentItem.unitPrice)
            }
            setForm({ ...form, items: [...form.items, newItem] })
        }

        setCurrentItem({
            stockItemId: '',
            quantity: '',
            unitPrice: ''
        })
        setError('')
    }

    const removeItemFromOrder = (index) => {
        const updatedItems = form.items.filter((_, i) => i !== index)
        setForm({ ...form, items: updatedItems })
    }

    const handleSupplierSelect = (supplier) => {
        setForm({
            ...form,
            supplierName: supplier.name
        })
        setSupplierSearch(supplier.name)
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
            if (!form.supplierName.trim()) {
                setError('Supplier name is required')
                setSubmitting(false)
                return
            }

            if (form.items.length === 0) {
                setError('Please add at least one item to the order')
                setSubmitting(false)
                return
            }

            const totalAmount = calculateOrderTotal()

            // Find supplier by name (optional - allows creating new suppliers)
            const supplier = suppliers.find(s => s.name === form.supplierName)

            const orderData = {
                supplierId: supplier?._id || undefined,
                supplierName: form.supplierName,
                items: form.items,
                totalAmount,
                expectedDeliveryDate: form.expectedDeliveryDate || null,
                notes: form.notes
            }

            await purchaseOrderAPI.create(orderData)

            toast({
                title: 'Success',
                description: 'Purchase order created successfully'
            })

            setForm({
                supplierName: '',
                items: [],
                expectedDeliveryDate: '',
                notes: ''
            })
            setSupplierSearch('')
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create purchase order'
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

    const viewOrderDetails = (order) => {
        setViewingOrder(order)
        setViewDialogOpen(true)
    }

    const deleteOrder = async (orderId, supplierName) => {
        if (!confirm(`Are you sure you want to delete this purchase order from ${supplierName}?`)) {
            return
        }

        try {
            await purchaseOrderAPI.delete(orderId)
            toast({
                title: 'Success',
                description: 'Purchase order deleted successfully'
            })
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete purchase order',
                variant: 'destructive'
            })
        }
    }

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'completed': return 'default'
            case 'partially_received': return 'secondary'
            case 'cancelled': return 'destructive'
            default: return 'outline'
        }
    }

    const editOrder = (order) => {
        if (order.orderStatus === 'completed') {
            toast({ title: 'Cannot Edit', description: 'Completed orders cannot be edited', variant: 'destructive' })
            return
        }
        setEditingOrder(order)
        setEditForm({ items: order.items.map(item => ({ ...item })), notes: order.notes || '' })
        setEditDialogOpen(true)
    }

    const handleEditItemChange = (index, field, value) => {
        const updatedItems = [...editForm.items]
        if (field === 'quantity') updatedItems[index].quantity = value === '' ? 0 : parseInt(value)
        else if (field === 'costPrice') updatedItems[index].costPrice = value === '' ? 0 : parseFloat(value)
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].costPrice
        setEditForm({ ...editForm, items: updatedItems })
    }

    const calculateEditTotal = () => editForm.items.reduce((sum, item) => sum + item.total, 0)

    const handleEditSubmit = async () => {
        if (!editingOrder || editForm.items.length === 0) return
        try {
            setSubmitting(true)
            await purchaseOrderAPI.update(editingOrder._id, { items: editForm.items, totalAmount: calculateEditTotal(), notes: editForm.notes })
            toast({ title: 'Success', description: 'Purchase order updated successfully' })
            setEditDialogOpen(false)
            setEditingOrder(null)
            fetchData()
        } catch (error) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update order', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedOrders = purchaseOrders.slice(startIndex, startIndex + itemsPerPage)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage supplier orders (no stock impact)
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={stockItems.length === 0}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Purchase Order
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Purchase Order</DialogTitle>
                            <DialogDescription>
                                Create an order without affecting stock. Receipt will be created separately.
                            </DialogDescription>
                        </DialogHeader>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="supplier">Supplier Name *</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="supplier"
                                            placeholder="Search or enter supplier name..."
                                            value={supplierSearch}
                                            onChange={(e) => {
                                                setSupplierSearch(e.target.value)
                                                setForm({ ...form, supplierName: e.target.value })
                                                setShowSupplierDropdown(true)
                                            }}
                                            onFocus={() => setShowSupplierDropdown(true)}
                                            className="pl-8"
                                        />
                                        {showSupplierDropdown && supplierSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                {filteredSuppliers.length > 0 ? (
                                                    filteredSuppliers.map((supplier) => (
                                                        <div
                                                            key={supplier._id}
                                                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                                                            onClick={() => handleSupplierSelect(supplier)}
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
                                    <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                                    <Input
                                        id="expectedDate"
                                        type="date"
                                        value={form.expectedDeliveryDate}
                                        onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Add Item to Order</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stock-item">Stock Item</Label>
                                            <Select
                                                value={currentItem.stockItemId}
                                                onValueChange={handleStockItemChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select item" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stockItems.map((item) => (
                                                        <SelectItem key={item._id} value={item._id}>
                                                            {item.itemName}
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
                                                placeholder="1500"
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
                                        onClick={addItemToOrder}
                                        disabled={!currentItem.stockItemId || !currentItem.quantity || !currentItem.unitPrice}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </CardContent>
                            </Card>

                            {form.items.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Items in Order</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
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
                                                        <TableCell className="font-mono">{item.quantity} bags</TableCell>
                                                        <TableCell className="font-mono">{formatCurrency(item.costPrice)}</TableCell>
                                                        <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeItemFromOrder(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={2} className="font-medium">Total Order Amount</TableCell>
                                                    <TableCell className="font-mono font-bold text-lg">
                                                        {formatCurrency(calculateOrderTotal())}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    placeholder="Additional notes..."
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={submitting || form.items.length === 0}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Order...
                                        </>
                                    ) : (
                                        `Create Order - ${formatCurrency(calculateOrderTotal())}`
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

            {stockItems.length === 0 && (
                <Alert>
                    <AlertDescription>
                        No stock items available. Please add stock items first to create purchase orders.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                        Supplier orders awaiting receipt
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {purchaseOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <TrendingDown className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No purchase orders yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOrders.map((order) => (
                                        <TableRow key={order._id}>
                                            <TableCell className="font-mono">#{order.orderNumber}</TableCell>
                                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                                            <TableCell className="font-medium">{order.supplierName}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {order.items && order.items.length > 0
                                                        ? order.items.length === 1
                                                            ? order.items[0].itemName
                                                            : `${order.items[0].itemName}...`
                                                        : 'Unknown'}
                                                    {order.items && order.items.length > 1 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {order.items.length} items
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant={getStatusBadgeVariant(order.paymentStatus)} className="text-xs">
                                                        {order.paymentStatus === 'paid' ? 'PAID' :
                                                            order.paymentStatus === 'partial' ? 'PARTIALLY PAID' : 'UNPAID'}
                                                    </Badge>
                                                    <Badge variant={getStatusBadgeVariant(order.orderStatus)} className="text-xs">
                                                        {order.orderStatus === 'completed' ? 'RECEIVED' :
                                                            order.orderStatus === 'partially_received' ? 'PARTIALLY RECEIVED' : 'NOT RECEIVED'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {order.orderStatus !== 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editOrder(order)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewOrderDetails(order)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteOrder(order._id, order.supplierName)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        disabled={order.linkedDeliveries && order.linkedDeliveries.length > 0}
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
                                totalItems={purchaseOrders.length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Purchase Order Details - #{viewingOrder?.orderNumber}</DialogTitle>
                        <DialogDescription>
                            Order details and receipt status
                        </DialogDescription>
                    </DialogHeader>

                    {viewingOrder && (
                        <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Order Number</Label>
                                    <p className="font-mono font-medium">#{viewingOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Order Date</Label>
                                    <p className="font-medium">{formatDate(viewingOrder.orderDate)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Supplier</Label>
                                    <p className="font-medium">{viewingOrder.supplierName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <Badge variant={getStatusBadgeVariant(viewingOrder.orderStatus)}>
                                        {viewingOrder.orderStatus.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="font-semibold mb-3">Order Items</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Ordered Qty</TableHead>
                                            <TableHead>Received Qty</TableHead>
                                            <TableHead>Remaining</TableHead>
                                            <TableHead>Cost Price</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingOrder.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell className="font-mono">{item.receivedQuantity || 0}</TableCell>
                                                <TableCell className="font-mono font-bold">
                                                    {item.quantity - (item.receivedQuantity || 0)}
                                                </TableCell>
                                                <TableCell className="font-mono">{formatCurrency(item.costPrice)}</TableCell>
                                                <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={5} className="font-semibold">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg">{formatCurrency(viewingOrder.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Payment Status */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <Label className="text-muted-foreground">Total Amount</Label>
                                    <p className="font-mono font-bold">{formatCurrency(viewingOrder.totalAmount)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Amount Paid</Label>
                                    <p className="font-mono font-bold text-green-600">{formatCurrency(viewingOrder.amountPaid || 0)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Amount Due</Label>
                                    <p className="font-mono font-bold text-orange-600">{formatCurrency(viewingOrder.amountDue || viewingOrder.totalAmount)}</p>
                                </div>
                            </div>

                            {/* Notes */}
                            {viewingOrder.notes && (
                                <div>
                                    <Label className="text-muted-foreground">Notes</Label>
                                    <p className="mt-1">{viewingOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Purchase Order - #{editingOrder?.orderNumber}</DialogTitle>
                        <DialogDescription>Update order quantities and prices</DialogDescription>
                    </DialogHeader>
                    {editingOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div><Label className="text-muted-foreground">Order #</Label><p className="font-mono font-medium">#{editingOrder.orderNumber}</p></div>
                                <div><Label className="text-muted-foreground">Supplier</Label><p className="font-medium">{editingOrder.supplierName}</p></div>
                                <div><Label className="text-muted-foreground">Date</Label><p className="font-medium">{formatDate(editingOrder.orderDate)}</p></div>
                            </div>
                            <div><h3 className="font-semibold mb-3">Items</h3>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Quantity</TableHead><TableHead>Cost Price</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {editForm.items.map((item, idx) => (<TableRow key={idx}><TableCell className="font-medium">{item.itemName}</TableCell><TableCell><Input type="number" min="0" value={item.quantity} onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)} className="w-24" /></TableCell><TableCell><Input type="number" min="0" step="0.01" value={item.costPrice === 0 ? '0' : (item.costPrice || '')} onChange={(e) => handleEditItemChange(idx, 'costPrice', e.target.value)} className="w-28" /></TableCell><TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell></TableRow>))}
                                        <TableRow><TableCell colSpan={2} className="font-semibold">Total</TableCell><TableCell className="font-mono font-bold text-lg" colSpan={2}>{formatCurrency(calculateEditTotal())}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="space-y-2"><Label>Notes</Label><Input placeholder="Notes..." value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
                            <div className="flex gap-3 pt-4">
                                <Button onClick={handleEditSubmit} disabled={submitting} className="flex-1">{submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : `Update - ${formatCurrency(calculateEditTotal())}`}</Button>
                                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={submitting}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default PurchaseOrders
