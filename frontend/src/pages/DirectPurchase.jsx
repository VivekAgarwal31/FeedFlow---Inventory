import React, { useState, useEffect } from 'react'
import { Plus, Package, Loader2, Trash2, Search, Eye, Pencil } from 'lucide-react'
import { supplierAPI, warehouseAPI, stockAPI, directPurchaseAPI } from '../lib/api'
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

const DirectPurchase = () => {
    const [purchases, setPurchases] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [warehouses, setWarehouses] = useState([])
    const [stockItems, setStockItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [viewingPurchase, setViewingPurchase] = useState(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingPurchase, setEditingPurchase] = useState(null)
    const [editForm, setEditForm] = useState({ items: [], notes: '' })
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [supplierSearch, setSupplierSearch] = useState('')
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12
    const { toast } = useToast()
    const { user } = useAuth()

    const [form, setForm] = useState({
        supplierId: '',
        supplierName: '',
        items: [],
        purchaseDate: new Date().toISOString().split('T')[0],
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
            const [purchasesResponse, suppliersResponse, warehousesResponse, stockResponse] = await Promise.all([
                api.get('/direct-purchases', { params: { page: 1, limit: 100 } }),
                supplierAPI.getAll(),
                warehouseAPI.getAll(),
                stockAPI.getAll()
            ])

            setPurchases(purchasesResponse.data.purchases || [])
            setSuppliers(suppliersResponse.data.suppliers || [])
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

    const handleSupplierSelect = async (supplier) => {
        if (typeof supplier === 'string') {
            // User entered a new supplier name
            try {
                const response = await supplierAPI.create({ name: supplier })
                const newSupplier = response.data.supplier
                setSuppliers([...suppliers, newSupplier])
                setForm({ ...form, supplierId: newSupplier._id, supplierName: newSupplier.name })
                setSupplierSearch(newSupplier.name)
                toast({
                    title: 'Success',
                    description: `Supplier "${newSupplier.name}" created successfully`
                })
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'Failed to create supplier',
                    variant: 'destructive'
                })
            }
        } else {
            // Existing supplier selected
            setForm({ ...form, supplierId: supplier._id, supplierName: supplier.name })
            setSupplierSearch(supplier.name)
        }
        setShowSupplierDropdown(false)
    }

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
    )

    const isNewSupplier = supplierSearch && filteredSuppliers.length === 0

    const addItem = () => {
        setForm({
            ...form,
            items: [...form.items, {
                itemId: '',
                itemName: '',
                warehouseId: '',
                warehouseName: '',
                quantity: 0,
                costPrice: 0,
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
                updatedItems[index].costPrice = item.costPrice || 0
            }
        } else if (field === 'warehouseId') {
            const warehouse = warehouses.find(w => w._id === value)
            if (warehouse) {
                updatedItems[index].warehouseId = value
                updatedItems[index].warehouseName = warehouse.name
            }
        } else if (field === 'quantity') {
            updatedItems[index].quantity = value === '' ? 0 : parseInt(value)
        } else if (field === 'costPrice') {
            updatedItems[index].costPrice = value === '' ? 0 : parseFloat(value)
        }

        // Recalculate total
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].costPrice

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
            if (!form.supplierId) {
                setError('Please select a supplier')
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

            const purchaseData = {
                supplierId: form.supplierId,
                items: form.items.map(item => ({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    warehouseId: item.warehouseId,
                    warehouseName: item.warehouseName,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    total: item.total
                })),
                totalAmount: calculateTotal(),
                purchaseDate: form.purchaseDate,
                notes: form.notes,
                paymentType: form.paymentType,
                paymentMethod: form.paymentMethod,
                staffName: user?.fullName || 'Unknown'
            }

            await api.post('/direct-purchases', purchaseData)

            toast({
                title: 'Success',
                description: 'Direct purchase created successfully'
            })

            setForm({
                supplierId: '',
                supplierName: '',
                items: [],
                purchaseDate: new Date().toISOString().split('T')[0],
                notes: '',
                paymentType: 'cash',
                paymentMethod: 'cash'
            })
            setSupplierSearch('')
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create purchase'
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

    const deletePurchase = async (purchaseId, purchaseNumber) => {
        if (!confirm(`Are you sure you want to cancel purchase #${purchaseNumber}? This will reverse stock.`)) {
            return
        }

        try {
            await api.delete(`/direct-purchases/${purchaseId}`)
            toast({
                title: 'Success',
                description: 'Purchase cancelled and stock reversed'
            })
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to cancel purchase',
                variant: 'destructive'
            })
        }
    }

    const viewPurchase = (purchase) => {
        setViewingPurchase(purchase)
        setViewDialogOpen(true)
    }

    const editPurchase = (purchase) => {
        setEditingPurchase(purchase)
        setEditForm({
            items: purchase.items.map(item => ({ ...item })),
            notes: purchase.notes || ''
        })
        setEditDialogOpen(true)
    }

    const handleEditItemChange = (index, field, value) => {
        const updatedItems = [...editForm.items]

        if (field === 'quantity') {
            updatedItems[index].quantity = value === '' ? 0 : parseInt(value)
        } else if (field === 'costPrice') {
            updatedItems[index].costPrice = value === '' ? 0 : parseFloat(value)
        }

        // Recalculate total
        updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].costPrice

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
                costPrice: 0,
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
        if (!editingPurchase) return

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
            await directPurchaseAPI.update(editingPurchase._id, {
                items: editForm.items,
                notes: editForm.notes
            })

            toast({
                title: 'Success',
                description: 'Direct purchase updated successfully'
            })

            setEditDialogOpen(false)
            setEditingPurchase(null)
            fetchData()
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update purchase',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const totalPages = Math.ceil(purchases.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedPurchases = purchases.slice(startIndex, startIndex + itemsPerPage)

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
                    <h1 className="text-3xl font-bold tracking-tight">Direct Purchases</h1>
                    <p className="text-muted-foreground mt-1">
                        Create direct purchases without orders (increases stock, creates payable)
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Direct Purchase
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Direct Purchase</DialogTitle>
                            <DialogDescription>
                                Select supplier and add items to create a direct purchase
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
                                                    <div
                                                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-blue-600 font-medium"
                                                        onClick={() => handleSupplierSelect(supplierSearch)}
                                                    >
                                                        <Plus className="inline h-4 w-4 mr-1" />
                                                        Create "{supplierSearch}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                                    <Input
                                        id="purchaseDate"
                                        type="date"
                                        value={form.purchaseDate}
                                        onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
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
                                        ? 'Cash purchases update cash account immediately'
                                        : 'Credit purchases create payable for the supplier'}
                                </p>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Purchase Items</CardTitle>
                                            <CardDescription>Add items to this purchase</CardDescription>
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
                                                    <TableHead>Cost Price</TableHead>
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
                                                                step="0.01"
                                                                placeholder="0.00"
                                                                value={item.costPrice === 0 ? '0' : (item.costPrice || '')}
                                                                onChange={(e) => handleItemChange(index, 'costPrice', e.target.value)}
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
                                    disabled={submitting || !form.supplierId || form.items.length === 0}
                                    className="flex-1"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating Purchase...
                                        </>
                                    ) : (
                                        `Create Purchase - ${formatCurrency(calculateTotal())}`
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
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>
                        Direct purchases that have increased stock and created payables
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {purchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No purchases yet</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Purchase #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Payment Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPurchases.map((purchase) => (
                                        <TableRow key={purchase._id}>
                                            <TableCell className="font-mono">#{purchase.purchaseNumber}</TableCell>
                                            <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                                            <TableCell className="font-medium">{purchase.supplierName}</TableCell>
                                            <TableCell>
                                                {purchase.items && purchase.items.length > 0
                                                    ? purchase.items.length === 1
                                                        ? purchase.items[0].itemName
                                                        : `${purchase.items.length} items`
                                                    : 'Unknown'}
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">{formatCurrency(purchase.totalAmount)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${purchase.paymentStatus === 'cash' ? 'bg-green-100 text-green-800' :
                                                    purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                        purchase.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {purchase.paymentStatus === 'cash' ? 'Cash' :
                                                        purchase.paymentStatus === 'paid' ? 'Paid' :
                                                            purchase.paymentStatus === 'partial' ? 'Partial' :
                                                                'Pending'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    {purchase.purchaseStatus === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => editPurchase(purchase)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => viewPurchase(purchase)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {purchase.purchaseStatus === 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deletePurchase(purchase._id, purchase.purchaseNumber)}
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
                                totalItems={purchases.length}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View Purchase Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Direct Purchase Details - #{viewingPurchase?.purchaseNumber}</DialogTitle>
                        <DialogDescription>
                            Purchase details and items purchased
                        </DialogDescription>
                    </DialogHeader>

                    {viewingPurchase && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Purchase Number</Label>
                                    <p className="font-mono font-medium">#{viewingPurchase.purchaseNumber}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Purchase Date</Label>
                                    <p className="font-medium">{formatDate(viewingPurchase.purchaseDate)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Supplier</Label>
                                    <p className="font-medium">{viewingPurchase.supplierName}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <p className="font-medium capitalize">{viewingPurchase.purchaseStatus}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Items Purchased</h3>
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
                                        {viewingPurchase.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.itemName}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell>{item.warehouseName}</TableCell>
                                                <TableCell className="font-mono">{formatCurrency(item.costPrice)}</TableCell>
                                                <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={4} className="font-medium text-right">Total Amount</TableCell>
                                            <TableCell className="font-mono font-bold text-lg">{formatCurrency(viewingPurchase.totalAmount)}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {viewingPurchase.notes && (
                                <div>
                                    <Label className="text-muted-foreground">Notes</Label>
                                    <p className="mt-1">{viewingPurchase.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Purchase Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Direct Purchase - #{editingPurchase?.purchaseNumber}</DialogTitle>
                        <DialogDescription>
                            Update items, quantities, prices, and notes
                        </DialogDescription>
                    </DialogHeader>

                    {editingPurchase && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Supplier (Read-only)</Label>
                                    <Input value={editingPurchase.supplierName} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Payment Type (Read-only)</Label>
                                    <Input value={editingPurchase.paymentType === 'cash' ? 'Cash' : 'Credit'} disabled className="bg-muted" />
                                </div>
                            </div>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Purchase Items</CardTitle>
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
                                                <TableHead>Cost Price</TableHead>
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
                                                            step="0.01"
                                                            value={item.costPrice === 0 ? '0' : (item.costPrice || '')}
                                                            onChange={(e) => handleEditItemChange(index, 'costPrice', e.target.value)}
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
                                        `Update Purchase - ${formatCurrency(calculateEditTotal())}`
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

export default DirectPurchase
