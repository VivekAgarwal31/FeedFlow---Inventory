import React, { useState, useEffect } from 'react'
import { Plus, Package, Loader2, Trash2, Search, Eye, Pencil } from 'lucide-react'
import { deliveryAPI, salesOrderAPI, clientAPI, warehouseAPI } from '../lib/api'
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

const DeliveryOut = () => {
    const [deliveries, setDeliveries] = useState([])
    const [clients, setClients] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [pendingOrders, setPendingOrders] = useState([])
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [viewingDelivery, setViewingDelivery] = useState(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingDelivery, setEditingDelivery] = useState(null)
    const [editForm, setEditForm] = useState({ items: [], wages: 0, notes: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [clientSearch, setClientSearch] = useState('')
    const [showClientDropdown, setShowClientDropdown] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const { toast } = useToast()

    const [form, setForm] = useState({
        clientName: '',
        salesOrderId: '',
        items: [],
        wages: 0,
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [deliveriesResponse, clientsResponse, warehousesResponse] = await Promise.all([
                deliveryAPI.getAllOut({ page: 1, limit: 100 }),
                clientAPI.getAll(),
                warehouseAPI.getAll()
            ])

            setDeliveries(deliveriesResponse.data.deliveries || [])
            setClients(clientsResponse.data.clients || [])
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

    const handleClientSelect = async (client) => {
        setForm({ ...form, clientName: client.name, salesOrderId: '', items: [] })
        setClientSearch(client.name)
        setShowClientDropdown(false)
        setSelectedOrder(null)

        // Fetch pending orders for this client
        try {
            const response = await salesOrderAPI.getPendingByClient(client._id)
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

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase())
    )

    const handleOrderSelect = (orderId) => {
        const order = pendingOrders.find(o => o._id === orderId)
        if (!order) return

        setSelectedOrder(order)
        setForm({
            ...form,
            salesOrderId: orderId,
            wages: order.wages || 0,
            items: order.items.map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                orderedQty: item.quantity,
                deliveredQty: item.deliveredQuantity || 0,
                remainingQty: item.quantity - (item.deliveredQuantity || 0),
                quantity: 0,
                sellingPrice: item.sellingPrice,
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
        updatedItems[index].total = qty * updatedItems[index].sellingPrice

        if (!updatedItems[index].isSplit) {
            updatedItems[index].warehouseAllocations[0].quantity = qty
            updatedItems[index].warehouseAllocations[0].total = qty * updatedItems[index].sellingPrice
        }

        setForm({ ...form, items: updatedItems })
    }

    const toggleSplit = (index) => {
        const updatedItems = [...form.items]
        updatedItems[index].isSplit = !updatedItems[index].isSplit

        if (updatedItems[index].isSplit) {
            const currentQty = updatedItems[index].quantity
            updatedItems[index].warehouseAllocations = [
                { ...updatedItems[index].warehouseAllocations[0], quantity: currentQty, total: currentQty * updatedItems[index].sellingPrice }
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
        updatedItems[itemIndex].warehouseAllocations[allocationIndex].total = qty * updatedItems[itemIndex].sellingPrice

        const totalQty = updatedItems[itemIndex].warehouseAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0)
        updatedItems[itemIndex].quantity = totalQty
        updatedItems[itemIndex].total = totalQty * updatedItems[itemIndex].sellingPrice

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

    const calculateDeliveryTotal = () => {
        const itemsTotal = form.items.reduce((sum, item) => sum + item.total, 0)
        const wages = parseFloat(form.wages) || 0
        return itemsTotal + wages
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            if (!form.salesOrderId) {
                setError('Please select a sales order')
                setSubmitting(false)
                return
            }

            const itemsToDeliver = form.items.filter(item => item.quantity > 0)

            if (itemsToDeliver.length === 0) {
                setError('Please enter delivery quantities for at least one item')
                setSubmitting(false)
                return
            }

            // Validate quantities and warehouses
            for (const item of itemsToDeliver) {
                if (item.quantity > item.remainingQty) {
                    setError(`Cannot deliver ${item.quantity} of ${item.itemName}. Only ${item.remainingQty} remaining.`)
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

            const totalAmount = calculateDeliveryTotal()

            // Transform items with allocations into flat item list
            const deliveryItems = []
            for (const item of itemsToDeliver) {
                const allocationsWithQty = item.warehouseAllocations.filter(alloc => alloc.quantity > 0)

                for (const alloc of allocationsWithQty) {
                    deliveryItems.push({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        quantity: alloc.quantity,
                        sellingPrice: item.sellingPrice,
                        warehouseId: alloc.warehouseId,
                        warehouseName: alloc.warehouseName,
                        total: alloc.total
                    })
                }
            }

            const deliveryData = {
                salesOrderId: form.salesOrderId,
                items: deliveryItems,
                wages: parseFloat(form.wages) || 0,
                totalAmount,
                deliveryDate: form.deliveryDate,
                notes: form.notes
            }

            await deliveryAPI.createOut(deliveryData)

            toast({
                title: 'Success',
                description: 'Delivery created successfully and stock updated'
            })

            setForm({
                clientName: '',
                salesOrderId: '',
                items: [],
                wages: 0,
                deliveryDate: new Date().toISOString().split('T')[0],
                notes: ''
            })
            setClientSearch('')
            setPendingOrders([])
            setSelectedOrder(null)
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create delivery'
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

    const deleteDelivery = async (deliveryId, deliveryNumber) => {
        if (!confirm(`Are you sure you want to reverse delivery #${deliveryNumber}? This will restore stock.`)) {
            return
        }

        try {
            await deliveryAPI.deleteOut(deliveryId)
            toast({
                title: 'Success',
                description: 'Delivery reversed and stock restored'
            })
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to reverse delivery',
                variant: 'destructive'
            })
        }
    }

    const viewDelivery = (delivery) => {
        setViewingDelivery(delivery)
        setViewDialogOpen(true)
    }

    const editDelivery = (delivery) => {
        setEditingDelivery(delivery)
        setEditForm({
            items: delivery.items.map(item => ({ ...item })),
            wages: delivery.wages || 0,
            notes: delivery.notes || ''
        })
        setEditDialogOpen(true)
    }

    const handleEditItemChange = (index, field, value) => {
        const updatedItems = [...editForm.items]
        if (field === 'quantity') {
            updatedItems[index].quantity = parseInt(value) || 0
        } else if (field === 'sellingPrice') {
            updatedItems[index].sellingPrice = parseFloat(value) || 0
        }
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].sellingPrice
        setEditForm({ ...editForm, items: updatedItems })
    }

    const calculateEditTotal = () => {
        const itemsTotal = editForm.items.reduce((sum, item) => sum + item.total, 0)
        const wages = parseFloat(editForm.wages) || 0
        return itemsTotal + wages
    }

    const handleEditSubmit = async () => {
        if (!editingDelivery) return

        if (editForm.items.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'At least one item is required',
                variant: 'destructive'
            })
            return
        }

        // Validate items
        for (const item of editForm.items) {
            if (!item.itemName || !item.warehouseId || item.quantity <= 0) {
                toast({
                    title: 'Validation Error',
                    description: 'All items must have name, warehouse, and positive quantity',
                    variant: 'destructive'
                })
                return
            }
        }

        try {
            setSubmitting(true)
            await deliveryAPI.updateOut(editingDelivery._id, {
                items: editForm.items,
                wages: editForm.wages,
                notes: editForm.notes
            })

            toast({
                title: 'Success',
                description: 'Delivery updated successfully'
            })

            setEditDialogOpen(false)
            setEditingDelivery(null)
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update delivery',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
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
                    <h1 className="text-3xl font-bold tracking-tight">Delivery Out</h1>
                    <p className="text-muted-foreground mt-1">
                        Create deliveries against sales orders (reduces stock)
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Delivery
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Delivery Out</DialogTitle>
                            <DialogDescription>
                                Select customer and sales order, then specify delivery quantities and warehouses
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
                                    <Label htmlFor="client">Customer *</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="client"
                                            placeholder="Search customer..."
                                            value={clientSearch}
                                            onChange={(e) => {
                                                setClientSearch(e.target.value)
                                                setShowClientDropdown(true)
                                            }}
                                            onFocus={() => setShowClientDropdown(true)}
                                            className="pl-8"
                                        />
                                        {showClientDropdown && clientSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map((client) => (
                                                        <div
                                                            key={client._id}
                                                            className="px-3 py-2 cursor-pointer hover:bg-muted"
                                                            onClick={() => handleClientSelect(client)}
                                                        >
                                                            {client.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-muted-foreground">
                                                        No customers found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="salesOrder">Sales Order *</Label>
                                    <Select
                                        value={form.salesOrderId}
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
                                        <CardTitle>Delivery Items</CardTitle>
                                        <CardDescription>Enter delivery quantities and select warehouses</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Ordered</TableHead>
                                                    <TableHead>Delivered</TableHead>
                                                    <TableHead>Remaining</TableHead>
                                                    <TableHead>Deliver Qty</TableHead>
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
                                                            <TableCell className="font-mono">{item.deliveredQty}</TableCell>
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
                                                    <TableCell colSpan={5} className="font-medium">Wages</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0"
                                                            value={form.wages}
                                                            onChange={(e) => setForm({ ...form, wages: e.target.value })}
                                                            className="w-32"
                                                        />
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={5} className="font-medium">Total Delivery Amount</TableCell>
                                                    <TableCell className="font-mono font-bold text-lg">
                                                        {formatCurrency(calculateDeliveryTotal())}
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
                                    <Label htmlFor="deliveryDate">Delivery Date</Label>
                                    <Input
                                        id="deliveryDate"
                                        type="date"
                                        value={form.deliveryDate}
                                        onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
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
                                    disabled={submitting || !form.salesOrderId}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Delivery...
                                        </>
                                    ) : (
                                        `Create Delivery - ${formatCurrency(calculateDeliveryTotal())}`
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
                    <CardTitle>Delivery History</CardTitle>
                    <CardDescription>
                        Sales deliveries that have reduced stock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No deliveries yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Delivery #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>SO #</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedDeliveries.map((delivery) => (
                                        <TableRow key={delivery._id}>
                                            <TableCell className="font-mono">#{delivery.deliveryNumber}</TableCell>
                                            <TableCell>{formatDate(delivery.deliveryDate)}</TableCell>
                                            <TableCell className="font-medium">{delivery.clientName}</TableCell>
                                            <TableCell className="font-mono">#{delivery.salesOrderNumber}</TableCell>
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
                                                        onClick={() => editDelivery(delivery)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
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
                                                        onClick={() => deleteDelivery(delivery._id, delivery.deliveryNumber)}
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
                        <DialogTitle>Delivery Out Details - #{viewingDelivery?.deliveryNumber}</DialogTitle>
                        <DialogDescription>
                            Delivery details and items delivered
                        </DialogDescription>
                    </DialogHeader>

                    {viewingDelivery && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Delivery Number</Label>
                                    <p className="font-mono font-medium">#{viewingDelivery.deliveryNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Delivery Date</Label>
                                    <p className="font-medium">{formatDate(viewingDelivery.deliveryDate)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Customer</Label>
                                    <p className="font-medium">{viewingDelivery.clientName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">SO Number</Label>
                                    <p className="font-mono font-medium">#{viewingDelivery.salesOrderNumber}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Items Delivered</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Warehouse</TableHead>
                                            <TableHead>Selling Price</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewingDelivery.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell>{item.warehouseName}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(item.sellingPrice)}</TableCell>
                                                <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        {viewingDelivery.wages > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="font-medium">Wages</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(viewingDelivery.wages)}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell colSpan={4} className="font-semibold">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg">{formatCurrency(viewingDelivery.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

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

            {/* Edit Delivery Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Delivery Out - #{editingDelivery?.deliveryNumber}</DialogTitle>
                        <DialogDescription>
                            Update delivery quantities and prices (affects stock and financials)
                        </DialogDescription>
                    </DialogHeader>

                    {editingDelivery && (
                        <div className="space-y-6">
                            {/* Read-only Order Info */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <Label className="text-muted-foreground">Sales Order</Label>
                                    <p className="font-mono font-medium">#{editingDelivery.salesOrderNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Customer</Label>
                                    <p className="font-medium">{editingDelivery.clientName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Delivery Date</Label>
                                    <p className="font-medium">{formatDate(editingDelivery.deliveryDate)}</p>
                                </div>
                            </div>

                            {/* Editable Items */}
                            <div>
                                <h3 className="font-semibold mb-3">Items</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Warehouse</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Selling Price</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editForm.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="text-muted-foreground">{item.warehouseName}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                                                        className="w-24"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.sellingPrice}
                                                        onChange={(e) => handleEditItemChange(index, 'sellingPrice', e.target.value)}
                                                        className="w-28"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono font-medium">
                                                    {formatCurrency(item.total)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={3} className="font-medium">Wages</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.wages}
                                                    onChange={(e) => setEditForm({ ...editForm, wages: e.target.value })}
                                                    className="w-28"
                                                />
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={3} className="font-semibold">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg" colSpan={2}>
                                                {formatCurrency(calculateEditTotal())}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notes</Label>
                                <Input
                                    id="edit-notes"
                                    placeholder="Additional notes..."
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleEditSubmit}
                                    disabled={submitting}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        `Update Delivery - ${formatCurrency(calculateEditTotal())}`
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditDialogOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DeliveryOut
