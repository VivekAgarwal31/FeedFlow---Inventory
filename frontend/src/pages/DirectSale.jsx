import React, { useState, useEffect } from 'react'
import { Plus, Package, Loader2, Trash2, Search, Eye, Pencil } from 'lucide-react'
import { clientAPI, warehouseAPI, stockAPI, directSaleAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'
import { Pagination } from '../components/ui/Pagination'
import api from '../lib/api'

const DirectSale = () => {
    const [sales, setSales] = useState([])
    const [clients, setClients] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [stockItems, setStockItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [viewingSale, setViewingSale] = useState(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingSale, setEditingSale] = useState(null)
    const [editForm, setEditForm] = useState({ items: [], notes: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [clientSearch, setClientSearch] = useState('')
    const [showClientDropdown, setShowClientDropdown] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const { toast } = useToast()
    const { user } = useAuth()

    const [form, setForm] = useState({
        clientId: '',
        clientName: '',
        items: [],
        saleDate: new Date().toISOString().split('T')[0],
        notes: '',
        paymentType: 'cash',
        paymentMethod: 'cash'
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [salesResponse, clientsResponse, warehousesResponse, stockResponse] = await Promise.all([
                api.get('/direct-sales', { params: { page: 1, limit: 100 } }),
                clientAPI.getAll(),
                warehouseAPI.getAll(),
                stockAPI.getAll()
            ])

            setSales(salesResponse.data.sales || [])
            setClients(clientsResponse.data.clients || [])
            setWarehouses(warehousesResponse.data.warehouses || [])

            // Deduplicate stock items by itemName to show each item only once
            const allStockItems = stockResponse.data.stockItems || []
            const uniqueItemsMap = new Map()

            allStockItems.forEach(item => {
                if (!uniqueItemsMap.has(item.itemName)) {
                    uniqueItemsMap.set(item.itemName, item)
                }
            })

            const uniqueItems = Array.from(uniqueItemsMap.values())
            setStockItems(uniqueItems)
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
        if (typeof client === 'string') {
            // User entered a new client name
            try {
                const response = await clientAPI.create({ name: client })
                const newClient = response.data.client
                setClients([...clients, newClient])
                setForm({ ...form, clientId: newClient._id, clientName: newClient.name })
                setClientSearch(newClient.name)
                toast({
                    title: 'Success',
                    description: `Client "${newClient.name}" created successfully`
                })
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Failed to create client',
                    variant: 'destructive'
                })
            }
        } else {
            // Existing client selected
            setForm({ ...form, clientId: client._id, clientName: client.name })
            setClientSearch(client.name)
        }
        setShowClientDropdown(false)
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase())
    )

    const isNewClient = clientSearch && filteredClients.length === 0

    const addItem = () => {
        setForm({
            ...form,
            items: [...form.items, {
                itemId: '',
                itemName: '',
                warehouseId: '',
                warehouseName: '',
                quantity: 0,
                sellingPrice: 0,
                total: 0
            }]
        })
    }

    const removeItem = (index) => {
        const updatedItems = form.items.filter((_, i) => i !== index)
        setForm({ ...form, items: updatedItems })
    }

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...form.items]

        if (field === 'itemId') {
            const item = stockItems.find(s => s._id === value)
            if (item) {
                updatedItems[index].itemId = value
                updatedItems[index].itemName = item.itemName
                updatedItems[index].sellingPrice = item.sellingPrice || 0
            }
        } else if (field === 'warehouseId') {
            const warehouse = warehouses.find(w => w._id === value)
            if (warehouse) {
                updatedItems[index].warehouseId = value
                updatedItems[index].warehouseName = warehouse.name
            }
        } else if (field === 'quantity') {
            updatedItems[index].quantity = parseInt(value) || 0
        } else if (field === 'sellingPrice') {
            updatedItems[index].sellingPrice = parseFloat(value) || 0
        }

        // Recalculate total
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].sellingPrice

        setForm({ ...form, items: updatedItems })
    }

    const calculateTotal = () => {
        return form.items.reduce((sum, item) => sum + item.total, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')

        try {
            if (!form.clientId) {
                setError('Please select a client')
                setSubmitting(false)
                return
            }

            if (form.items.length === 0) {
                setError('Please add at least one item')
                setSubmitting(false)
                return
            }

            // Validate items
            for (const item of form.items) {
                if (!item.itemId || !item.warehouseId || item.quantity <= 0) {
                    setError('Please complete all item details')
                    setSubmitting(false)
                    return
                }
            }

            const saleData = {
                clientId: form.clientId,
                items: form.items.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    warehouseId: item.warehouseId,
                    warehouseName: item.warehouseName,
                    quantity: item.quantity,
                    sellingPrice: item.sellingPrice,
                    total: item.total
                })),
                totalAmount: calculateTotal(),
                saleDate: form.saleDate,
                notes: form.notes,
                paymentType: form.paymentType,
                paymentMethod: form.paymentMethod,
                staffName: user?.fullName || 'Unknown'
            }

            await api.post('/direct-sales', saleData)

            toast({
                title: 'Success',
                description: 'Direct sale created successfully'
            })

            setForm({
                clientId: '',
                clientName: '',
                items: [],
                saleDate: new Date().toISOString().split('T')[0],
                notes: '',
                paymentType: 'cash',
                paymentMethod: 'cash'
            })
            setClientSearch('')
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create sale'
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

    const deleteSale = async (saleId, saleNumber) => {
        if (!confirm(`Are you sure you want to cancel sale #${saleNumber}? This will restore stock.`)) {
            return
        }

        try {
            await api.delete(`/direct-sales/${saleId}`)
            toast({
                title: 'Success',
                description: 'Sale cancelled and stock restored'
            })
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to cancel sale',
                variant: 'destructive'
            })
        }
    }

    const viewSale = (sale) => {
        setViewingSale(sale)
        setViewDialogOpen(true)
    }

    const editSale = (sale) => {
        setEditingSale(sale)
        setEditForm({
            items: sale.items.map(item => ({ ...item })),
            notes: sale.notes || ''
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

        // Recalculate total
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].sellingPrice

        setEditForm({ ...editForm, items: updatedItems })
    }

    const addEditItem = () => {
        setEditForm({
            ...editForm,
            items: [...editForm.items, {
                itemId: '',
                itemName: '',
                warehouseId: '',
                warehouseName: '',
                quantity: 0,
                sellingPrice: 0,
                total: 0
            }]
        })
    }

    const removeEditItem = (index) => {
        setEditForm({
            ...editForm,
            items: editForm.items.filter((_, i) => i !== index)
        })
    }

    const calculateEditTotal = () => {
        return editForm.items.reduce((sum, item) => sum + item.total, 0)
    }

    const handleEditSubmit = async () => {
        if (!editingSale) return

        if (editForm.items.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please add at least one item',
                variant: 'destructive'
            })
            return
        }

        // Validate items
        for (const item of editForm.items) {
            if (!item.itemName || !item.warehouseId || item.quantity <= 0) {
                toast({
                    title: 'Validation Error',
                    description: 'Please complete all item details',
                    variant: 'destructive'
                })
                return
            }
        }

        try {
            setSubmitting(true)
            await directSaleAPI.update(editingSale._id, {
                items: editForm.items,
                notes: editForm.notes
            })

            toast({
                title: 'Success',
                description: 'Direct sale updated successfully'
            })

            setEditDialogOpen(false)
            setEditingSale(null)
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update sale',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const totalPages = Math.ceil(sales.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedSales = sales.slice(startIndex, startIndex + itemsPerPage)

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
                    <h1 className="text-3xl font-bold tracking-tight">Direct Sales</h1>
                    <p className="text-muted-foreground mt-1">
                        Create direct sales without orders (reduces stock, creates receivable)
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Direct Sale
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Direct Sale</DialogTitle>
                            <DialogDescription>
                                Select client and add items to create a direct sale
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
                                    <Label htmlFor="client">Client *</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="client"
                                            placeholder="Search client..."
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
                                                    <div
                                                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-blue-600 font-medium"
                                                        onClick={() => handleClientSelect(clientSearch)}
                                                    >
                                                        <Plus className="inline h-4 w-4 mr-1" />
                                                        Create "{clientSearch}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="saleDate">Sale Date</Label>
                                    <Input
                                        id="saleDate"
                                        type="date"
                                        value={form.saleDate}
                                        onChange={(e) => setForm({ ...form, saleDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Payment Type Selection */}
                            <div className="space-y-3">
                                <Label>Payment Type</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="cash"
                                            checked={form.paymentType === 'cash'}
                                            onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-sm font-medium">Cash</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value="credit"
                                            checked={form.paymentType === 'credit'}
                                            onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-sm font-medium">Credit</span>
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {form.paymentType === 'cash'
                                        ? 'Cash sales update cash account immediately'
                                        : 'Credit sales create receivable for the client'}
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Sale Items</CardTitle>
                                            <CardDescription>Add items to this sale</CardDescription>
                                        </div>
                                        <Button type="button" onClick={addItem} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Item
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {form.items.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No items added yet. Click "Add Item" to start.
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Warehouse</TableHead>
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {form.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Select
                                                                value={item.itemId}
                                                                onValueChange={(value) => handleItemChange(index, 'itemId', value)}
                                                            >
                                                                <SelectTrigger className="w-40">
                                                                    <SelectValue placeholder="Select item" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {stockItems.map((stock) => (
                                                                        <SelectItem key={stock._id} value={stock._id}>
                                                                            {stock.itemName}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={item.warehouseId}
                                                                onValueChange={(value) => handleItemChange(index, 'warehouseId', value)}
                                                            >
                                                                <SelectTrigger className="w-32">
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
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                placeholder="0"
                                                                value={item.quantity || ''}
                                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                                className="w-20"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={item.sellingPrice || ''}
                                                                onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                                                                className="w-24"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-mono font-medium">
                                                            {formatCurrency(item.total)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItem(index)}
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow>
                                                    <TableCell colSpan={4} className="font-medium text-right">Total Amount</TableCell>
                                                    <TableCell className="font-mono font-bold text-lg">
                                                        {formatCurrency(calculateTotal())}
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>

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
                                    disabled={submitting || !form.clientId || form.items.length === 0}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Sale...
                                        </>
                                    ) : (
                                        `Create Sale - ${formatCurrency(calculateTotal())}`
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
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>
                        Direct sales that have reduced stock and created receivables
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No sales yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sale #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedSales.map((sale) => (
                                        <TableRow key={sale._id}>
                                            <TableCell className="font-mono">#{sale.saleNumber}</TableCell>
                                            <TableCell>{formatDate(sale.saleDate)}</TableCell>
                                            <TableCell className="font-medium">{sale.clientName}</TableCell>
                                            <TableCell>
                                                {sale.items && sale.items.length > 0
                                                    ? sale.items.length === 1
                                                        ? sale.items[0].itemName
                                                        : `${sale.items.length} items`
                                                    : 'Unknown'}
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">{formatCurrency(sale.totalAmount)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${sale.paymentStatus === 'cash' ? 'bg-green-100 text-green-800' :
                                                    sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                        sale.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {sale.paymentStatus === 'cash' ? 'Cash' :
                                                        sale.paymentStatus === 'paid' ? 'Paid' :
                                                            sale.paymentStatus === 'partial' ? 'Partial' :
                                                                'Pending'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {sale.saleStatus === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editSale(sale)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewSale(sale)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {sale.saleStatus === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteSale(sale._id, sale.saleNumber)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
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
                                totalItems={sales.length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View Sale Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Direct Sale Details - #{viewingSale?.saleNumber}</DialogTitle>
                        <DialogDescription>
                            Sale details and items sold
                        </DialogDescription>
                    </DialogHeader>

                    {viewingSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Sale Number</Label>
                                    <p className="font-mono font-medium">#{viewingSale.saleNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Sale Date</Label>
                                    <p className="font-medium">{formatDate(viewingSale.saleDate)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Client</Label>
                                    <p className="font-medium">{viewingSale.clientName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <p className="font-medium capitalize">{viewingSale.saleStatus}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Items Sold</h3>
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
                                        {viewingSale.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell>{item.warehouseName}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(item.sellingPrice)}</TableCell>
                                                <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} className="font-medium text-right">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg">{formatCurrency(viewingSale.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {viewingSale.notes && (
                                <div>
                                    <Label className="text-muted-foreground">Notes</Label>
                                    <p className="mt-1">{viewingSale.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Sale Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Direct Sale - #{editingSale?.saleNumber}</DialogTitle>
                        <DialogDescription>
                            Update items, quantities, prices, and notes
                        </DialogDescription>
                    </DialogHeader>

                    {editingSale && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Client (Read-only)</Label>
                                    <Input value={editingSale.clientName} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Type (Read-only)</Label>
                                    <Input value={editingSale.paymentType === 'cash' ? 'Cash' : 'Credit'} disabled className="bg-muted" />
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Sale Items</CardTitle>
                                            <CardDescription>Edit quantities and prices</CardDescription>
                                        </div>
                                        <Button type="button" onClick={addEditItem} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Item
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead>Warehouse</TableHead>
                                                <TableHead>Quantity</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {editForm.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                                    <TableCell>{item.warehouseName}</TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleEditItemChange(index, 'quantity', e.target.value)}
                                                            className="w-20"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.sellingPrice}
                                                            onChange={(e) => handleEditItemChange(index, 'sellingPrice', e.target.value)}
                                                            className="w-24"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-mono font-medium">
                                                        {formatCurrency(item.total)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeEditItem(index)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={4} className="font-medium text-right">Total Amount</TableCell>
                                                <TableCell className="font-mono font-bold text-lg">
                                                    {formatCurrency(calculateEditTotal())}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <Label htmlFor="edit-notes">Notes</Label>
                                <Input
                                    id="edit-notes"
                                    placeholder="Additional notes..."
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={handleEditSubmit}
                                    disabled={submitting || editForm.items.length === 0}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        `Update Sale - ${formatCurrency(calculateEditTotal())}`
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

export default DirectSale
