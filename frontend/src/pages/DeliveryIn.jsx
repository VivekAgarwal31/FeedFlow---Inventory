import React, { useState, useEffect } from 'react'
import { Plus, PackageCheck, Loader2, Trash2, Search, Eye } from 'lucide-react'
import { deliveryAPI, purchaseOrderAPI, supplierAPI, warehouseAPI } from '../lib/api'
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

const DeliveryIn = () => {
    const [deliveries, setDeliveries] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [pendingOrders, setPendingOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [viewingDelivery, setViewingDelivery] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [supplierSearch, setSupplierSearch] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const { toast } = useToast()

    const [form, setForm] = useState({
        supplierName: '',
        purchaseOrderId: '',
        items: [],
        receiptDate: new Date().toISOString().split('T')[0],
        notes: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [deliveriesResponse, suppliersResponse, warehousesResponse] = await Promise.all([
                deliveryAPI.getAllIn({ page: 1, limit: 100 }),
                supplierAPI.getAll(),
                warehouseAPI.getAll()
            ])

            setDeliveries(deliveriesResponse.data.deliveries || [])
            setSuppliers(suppliersResponse.data.suppliers || [])
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

    const handleSupplierSelect = async (supplier) => {
        setForm({ ...form, supplierName: supplier.name, purchaseOrderId: '', items: [] })
        setSupplierSearch(supplier.name)
        setShowSupplierDropdown(false)
        setSelectedOrder(null)

        // Fetch pending orders for this supplier
        try {
            const response = await purchaseOrderAPI.getPendingBySupplier(supplier._id)
            setPendingOrders(response.data || [])
        } catch (error) {
            console.error('Failed to fetch pending orders:', error)
            toast({
                title: 'Error',
                description: 'Failed to load pending orders',
                variant: 'destructive'
            })
        }
    }

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
    )

    const handleOrderSelect = (orderId) => {
        const order = pendingOrders.find(o => o._id === orderId)
        if (!order) return

        setSelectedOrder(order)
        setForm({
            ...form,
            purchaseOrderId: orderId,
            items: order.items.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                orderedQty: item.quantity,
                receivedQty: item.receivedQuantity || 0,
                remainingQty: item.quantity - (item.receivedQuantity || 0),
                quantity: 0,
                costPrice: item.costPrice,
                total: 0,
                isSplit: false,
                warehouseAllocations: [
                    { warehouseId: '', warehouseName: '', quantity: 0, total: 0 }
                ]
            }))
        })
    }

    const handleItemQuantityChange = (index, quantity) => {
        const updatedItems = [...form.items]
        const qty = parseInt(quantity) || 0
        updatedItems[index].quantity = qty
        updatedItems[index].total = qty * updatedItems[index].costPrice

        // If not split, update first allocation
        if (!updatedItems[index].isSplit) {
            updatedItems[index].warehouseAllocations[0].quantity = qty
            updatedItems[index].warehouseAllocations[0].total = qty * updatedItems[index].costPrice
        }

        setForm({ ...form, items: updatedItems })
    }

    const toggleSplit = (index) => {
        const updatedItems = [...form.items]
        updatedItems[index].isSplit = !updatedItems[index].isSplit

        // If switching to split mode, keep first allocation
        if (updatedItems[index].isSplit) {
            const currentQty = updatedItems[index].quantity
            updatedItems[index].warehouseAllocations = [
                { ...updatedItems[index].warehouseAllocations[0], quantity: currentQty, total: currentQty * updatedItems[index].costPrice }
            ]
        }

        setForm({ ...form, items: updatedItems })
    }

    const addWarehouseAllocation = (itemIndex) => {
        const updatedItems = [...form.items]
        updatedItems[itemIndex].warehouseAllocations.push({
            warehouseId: '',
            warehouseName: '',
            quantity: 0,
            total: 0
        })
        setForm({ ...form, items: updatedItems })
    }

    const removeWarehouseAllocation = (itemIndex, allocationIndex) => {
        const updatedItems = [...form.items]
        updatedItems[itemIndex].warehouseAllocations.splice(allocationIndex, 1)
        setForm({ ...form, items: updatedItems })
    }

    const handleAllocationQuantityChange = (itemIndex, allocationIndex, quantity) => {
        const updatedItems = [...form.items]
        const qty = parseInt(quantity) || 0
        updatedItems[itemIndex].warehouseAllocations[allocationIndex].quantity = qty
        updatedItems[itemIndex].warehouseAllocations[allocationIndex].total = qty * updatedItems[itemIndex].costPrice

        // Update total quantity
        const totalQty = updatedItems[itemIndex].warehouseAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0)
        updatedItems[itemIndex].quantity = totalQty
        updatedItems[itemIndex].total = totalQty * updatedItems[itemIndex].costPrice

        setForm({ ...form, items: updatedItems })
    }

    const handleAllocationWarehouseChange = (itemIndex, allocationIndex, warehouseId) => {
        const warehouse = warehouses.find(w => w._id === warehouseId)
        const updatedItems = [...form.items]
        updatedItems[itemIndex].warehouseAllocations[allocationIndex].warehouseId = warehouseId
        updatedItems[itemIndex].warehouseAllocations[allocationIndex].warehouseName = warehouse?.name || ''
        setForm({ ...form, items: updatedItems })
    }

    const handleItemWarehouseChange = (index, warehouseId) => {
        const warehouse = warehouses.find(w => w._id === warehouseId)
        const updatedItems = [...form.items]
        updatedItems[index].warehouseAllocations[0].warehouseId = warehouseId
        updatedItems[index].warehouseAllocations[0].warehouseName = warehouse?.name || ''
        setForm({ ...form, items: updatedItems })
    }

    const calculateReceiptTotal = () => {
        return form.items.reduce((sum, item) => sum + item.total, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            if (!form.purchaseOrderId) {
                setError('Please select a purchase order')
                setSubmitting(false)
                return
            }

            const itemsToReceive = form.items.filter(item => item.quantity > 0)

            if (itemsToReceive.length === 0) {
                setError('Please enter receipt quantities for at least one item')
                setSubmitting(false)
                return
            }

            // Validate quantities and warehouses
            for (const item of itemsToReceive) {
                if (item.quantity > item.remainingQty) {
                    setError(`Cannot receive ${item.quantity} of ${item.itemName}. Only ${item.remainingQty} remaining.`)
                    setSubmitting(false)
                    return
                }

                // Validate warehouse allocations
                for (const alloc of item.warehouseAllocations) {
                    if (alloc.quantity > 0 && !alloc.warehouseId) {
                        setError(`Please select warehouse for ${item.itemName}`)
                        setSubmitting(false)
                        return
                    }
                }

                // Check for duplicate warehouses
                const warehouseIds = item.warehouseAllocations.filter(a => a.quantity > 0).map(a => a.warehouseId)
                if (new Set(warehouseIds).size !== warehouseIds.length) {
                    setError(`Cannot select same warehouse multiple times for ${item.itemName}`)
                    setSubmitting(false)
                    return
                }
            }

            const totalAmount = calculateReceiptTotal()

            // Transform items with allocations into flat item list
            const deliveryItems = []
            for (const item of itemsToReceive) {
                const allocationsWithQty = item.warehouseAllocations.filter(alloc => alloc.quantity > 0)

                for (const alloc of allocationsWithQty) {
                    deliveryItems.push({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: alloc.quantity,
                        costPrice: item.costPrice,
                        warehouseId: alloc.warehouseId,
                        warehouseName: alloc.warehouseName,
                        total: alloc.total
                    })
                }
            }

            const deliveryData = {
                purchaseOrderId: form.purchaseOrderId,
                items: deliveryItems,
                totalAmount,
                receiptDate: form.receiptDate,
                notes: form.notes
            }

            await deliveryAPI.createIn(deliveryData)

            toast({
                title: 'Success',
                description: 'Receipt created successfully and stock updated'
            })

            setForm({
                supplierName: '',
                purchaseOrderId: '',
                items: [],
                receiptDate: new Date().toISOString().split('T')[0],
                notes: ''
            })
            setSupplierSearch('')
            setPendingOrders([])
            setSelectedOrder(null)
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create receipt'
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

    const deleteDelivery = async (deliveryId, grnNumber) => {
        if (!confirm(`Are you sure you want to reverse GRN #${grnNumber}? This will reduce stock.`)) {
            return
        }

        try {
            await deliveryAPI.deleteIn(deliveryId)
            toast({
                title: 'Success',
                description: 'Receipt reversed and stock reduced'
            })
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reverse receipt',
                variant: 'destructive'
            })
        }
    }

    const viewDelivery = (delivery) => {
        setViewingDelivery(delivery)
        setViewDialogOpen(true)
    }

    const totalPages = Math.ceil(deliveries.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedDeliveries = deliveries.slice(startIndex, startIndex + itemsPerPage)

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
                    <h1 className="text-3xl font-bold tracking-tight">Delivery In (GRN)</h1>
                    <p className="text-muted-foreground mt-1">
                        Create receipts against purchase orders (increases stock)
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Receipt
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Delivery In (GRN)</DialogTitle>
                            <DialogDescription>
                                Select supplier and purchase order, then specify receipt quantities and warehouses
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
                                    <Label htmlFor="supplier">Supplier *</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="supplier"
                                            placeholder="Search supplier..."
                                            value={supplierSearch}
                                            onChange={(e) => {
                                                setSupplierSearch(e.target.value)
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
                                                        No suppliers found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchaseOrder">Purchase Order *</Label>
                                    <Select
                                        value={form.purchaseOrderId}
                                        onValueChange={handleOrderSelect}
                                        disabled={pendingOrders.length === 0}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={pendingOrders.length === 0 ? "No pending orders" : "Select order"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pendingOrders.map((order) => (
                                                <SelectItem key={order._id} value={order._id}>
                                                    Order #{order.orderNumber} - {formatCurrency(order.totalAmount)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedOrder && form.items.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Receipt Items</CardTitle>
                                        <CardDescription>Enter receipt quantities and select warehouses</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Ordered</TableHead>
                                                    <TableHead>Received</TableHead>
                                                    <TableHead>Remaining</TableHead>
                                                    <TableHead>Receive Qty</TableHead>
                                                    <TableHead>Warehouse</TableHead>
                                                    <TableHead>Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {form.items.map((item, itemIndex) => (
                                                    <React.Fragment key={itemIndex}>
                                                        <TableRow>
                                                            <TableCell className="font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    {item.itemName}
                                                                    <Button
                                                                        type="button"
                                                                        variant={item.isSplit ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => toggleSplit(itemIndex)}
                                                                        className="h-6 text-xs"
                                                                    >
                                                                        {item.isSplit ? "✓ Split" : "Split"}
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-mono">{item.orderedQty}</TableCell>
                                                            <TableCell className="font-mono">{item.receivedQty}</TableCell>
                                                            <TableCell className="font-mono font-bold">{item.remainingQty}</TableCell>
                                                            <TableCell>
                                                                {!item.isSplit && (
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={item.remainingQty}
                                                                        placeholder="0"
                                                                        value={item.quantity || ''}
                                                                        onChange={(e) => handleItemQuantityChange(itemIndex, e.target.value)}
                                                                        className="w-20"
                                                                    />
                                                                )}
                                                                {item.isSplit && (
                                                                    <span className="font-mono font-bold">{item.quantity}</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {!item.isSplit && (
                                                                    <Select
                                                                        value={item.warehouseAllocations[0]?.warehouseId || ''}
                                                                        onValueChange={(value) => handleItemWarehouseChange(itemIndex, value)}
                                                                        disabled={!item.quantity || item.quantity === 0}
                                                                    >
                                                                        <SelectTrigger className="w-40">
                                                                            <SelectValue placeholder="Select" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {warehouses.map((warehouse) => (
                                                                                <SelectItem key={warehouse._id} value={warehouse._id}>
                                                                                    {warehouse.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="font-mono">{formatCurrency(item.total)}</TableCell>
                                                        </TableRow>
                                                        {item.isSplit && item.warehouseAllocations.map((alloc, allocIndex) => (
                                                            <TableRow key={`${itemIndex}-${allocIndex}`} className="bg-muted/30">
                                                                <TableCell colSpan={4} className="pl-12 text-sm text-muted-foreground">
                                                                    Allocation {allocIndex + 1}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={item.remainingQty}
                                                                        placeholder="0"
                                                                        value={alloc.quantity || ''}
                                                                        onChange={(e) => handleAllocationQuantityChange(itemIndex, allocIndex, e.target.value)}
                                                                        className="w-20"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-2">
                                                                        <Select
                                                                            value={alloc.warehouseId}
                                                                            onValueChange={(value) => handleAllocationWarehouseChange(itemIndex, allocIndex, value)}
                                                                            disabled={!alloc.quantity || alloc.quantity === 0}
                                                                        >
                                                                            <SelectTrigger className="w-40">
                                                                                <SelectValue placeholder="Select" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {warehouses.map((warehouse) => (
                                                                                    <SelectItem key={warehouse._id} value={warehouse._id}>
                                                                                        {warehouse.name}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        {item.warehouseAllocations.length > 1 && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => removeWarehouseAllocation(itemIndex, allocIndex)}
                                                                                className="text-red-600"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-mono">{formatCurrency(alloc.total)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {item.isSplit && (
                                                            <TableRow className="bg-muted/30">
                                                                <TableCell colSpan={7} className="pl-12">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addWarehouseAllocation(itemIndex)}
                                                                        className="text-xs"
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" />
                                                                        Add Warehouse
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={5} className="font-medium">Total Receipt Amount</TableCell>
                                                    <TableCell className="font-mono font-bold text-lg">
                                                        {formatCurrency(calculateReceiptTotal())}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="receiptDate">Receipt Date</Label>
                                    <Input
                                        id="receiptDate"
                                        type="date"
                                        value={form.receiptDate}
                                        onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Additional notes..."
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={submitting || !form.purchaseOrderId}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Receipt...
                                        </>
                                    ) : (
                                        `Create Receipt - ${formatCurrency(calculateReceiptTotal())}`
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

            <Card>
                <CardHeader>
                    <CardTitle>Receipt History (GRN)</CardTitle>
                    <CardDescription>
                        Purchase receipts that have increased stock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <PackageCheck className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No receipts yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>GRN #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>PO #</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedDeliveries.map((delivery) => (
                                        <TableRow key={delivery._id}>
                                            <TableCell className="font-mono">#{delivery.grnNumber}</TableCell>
                                            <TableCell>{formatDate(delivery.receiptDate)}</TableCell>
                                            <TableCell className="font-medium">{delivery.supplierName}</TableCell>
                                            <TableCell className="font-mono">#{delivery.purchaseOrderNumber}</TableCell>
                                            <TableCell>
                                                {delivery.items && delivery.items.length > 0
                                                    ? delivery.items.length === 1
                                                        ? delivery.items[0].itemName
                                                        : `${delivery.items.length} items`
                                                    : 'Unknown'}
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">{formatCurrency(delivery.totalAmount)}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewDelivery(delivery)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteDelivery(delivery._id, delivery.grnNumber)}
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
                                totalItems={deliveries.length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View Delivery Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Delivery In Details - GRN #{viewingDelivery?.grnNumber}</DialogTitle>
                        <DialogDescription>
                            Receipt details and items received
                        </DialogDescription>
                    </DialogHeader>

                    {viewingDelivery && (
                        <div className="space-y-6">
                            {/* Receipt Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">GRN Number</Label>
                                    <p className="font-mono font-medium">#{viewingDelivery.grnNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Receipt Date</Label>
                                    <p className="font-medium">{formatDate(viewingDelivery.receiptDate)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Supplier</Label>
                                    <p className="font-medium">{viewingDelivery.supplierName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">PO Number</Label>
                                    <p className="font-mono font-medium">#{viewingDelivery.purchaseOrderNumber}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div>
                                <h3 className="font-semibold mb-3">Items Received</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Warehouse</TableHead>
                                            <TableHead>Cost Price</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingDelivery.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell>{item.warehouseName}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(item.costPrice)}</TableCell>
                                                <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} className="font-semibold">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg">{formatCurrency(viewingDelivery.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Notes */}
                            {viewingDelivery.notes && (
                                <div>
                                    <Label className="text-muted-foreground">Notes</Label>
                                    <p className="mt-1">{viewingDelivery.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DeliveryIn
