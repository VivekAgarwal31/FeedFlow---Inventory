import React, { useState, useEffect } from 'react'
import { List, Calendar, Filter, Download, Search, ArrowUpFromLine, ArrowDownToLine, Settings, ArrowLeftRight, TrendingUp, TrendingDown, Eye, Trash2, Pencil } from 'lucide-react'
import { stockTransactionAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { useToast } from '../hooks/use-toast'
import { Pagination } from '../components/ui/Pagination'

const StockTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Refresh transactions when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTransactions()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, searchTerm, typeFilter, dateFilter, startDate, endDate])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await stockTransactionAPI.getAll({
        page: 1,
        limit: 500,
        type: typeFilter !== 'all' ? typeFilter : undefined
      })

      setTransactions(response.data.transactions || [])
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load transactions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterTransactions = () => {
    let filtered = transactions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(transaction => {
        const searchLower = searchTerm.toLowerCase()

        // Check top-level fields
        const matchesTopLevel =
          transaction.itemId?.itemName?.toLowerCase().includes(searchLower) ||
          transaction.warehouseId?.name?.toLowerCase().includes(searchLower) ||
          transaction.reference?.toLowerCase().includes(searchLower) ||
          transaction.notes?.toLowerCase().includes(searchLower)

        // Check items array (for consolidated transactions like Direct Sales/Purchases)
        const matchesItems = transaction.items?.some(item =>
          item.itemName?.toLowerCase().includes(searchLower) ||
          item.warehouseName?.toLowerCase().includes(searchLower)
        )

        return matchesTopLevel || matchesItems
      })
    }

    // Filter by type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      let filterStartDate = null
      let filterEndDate = null

      if (dateFilter === 'custom') {
        // Custom date range
        if (startDate) {
          filterStartDate = new Date(startDate)
          filterStartDate.setHours(0, 0, 0, 0)
        }
        if (endDate) {
          filterEndDate = new Date(endDate)
          filterEndDate.setHours(23, 59, 59, 999)
        } else if (startDate) {
          // If only start date is provided, treat as single day
          filterEndDate = new Date(startDate)
          filterEndDate.setHours(23, 59, 59, 999)
        }
      } else {
        // Preset date ranges
        switch (dateFilter) {
          case 'today':
            filterStartDate = new Date()
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate = new Date()
            filterEndDate.setHours(23, 59, 59, 999)
            break
          case 'week':
            filterStartDate = new Date()
            filterStartDate.setDate(now.getDate() - 7)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate = now
            break
          case 'month':
            filterStartDate = new Date()
            filterStartDate.setMonth(now.getMonth() - 1)
            filterStartDate.setHours(0, 0, 0, 0)
            filterEndDate = now
            break
        }
      }

      if (filterStartDate || filterEndDate) {
        filtered = filtered.filter(transaction => {
          const transactionDate = new Date(transaction.transactionDate || transaction.createdAt)
          if (filterStartDate && filterEndDate) {
            return transactionDate >= filterStartDate && transactionDate <= filterEndDate
          } else if (filterStartDate) {
            return transactionDate >= filterStartDate
          } else if (filterEndDate) {
            return transactionDate <= filterEndDate
          }
          return true
        })
      }
    }

    // Consolidate multi-warehouse transactions
    console.log('=== BEFORE CONSOLIDATION ===')
    console.log('Filtered transactions:', filtered.length)
    filtered.forEach((t, idx) => {
      console.log(`Transaction ${idx}:`, {
        type: t.type,
        itemName: t.itemName,
        warehouseName: t.warehouseName,
        referenceId: t.referenceId,
        items: t.items,
        itemsDetail: t.items?.map(item => ({
          itemName: item.itemName,
          warehouseName: item.warehouseName
        }))
      })
    })

    const consolidated = consolidateTransactions(filtered)
    setFilteredTransactions(consolidated)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const consolidateTransactions = (txs) => {
    const groupedMap = new Map()
    const result = []

    console.log('=== CONSOLIDATING TRANSACTIONS ===')
    console.log('Input transactions:', txs.length)

    txs.forEach(t => {
      console.log('Processing transaction:', {
        type: t.type,
        referenceId: t.referenceId,
        itemName: t.itemName,
        warehouseName: t.warehouseName,
        hasItems: !!t.items,
        itemsLength: t.items?.length
      })

      // Group by referenceId for purchases/sales
      if ((t.type === 'purchase' || t.type === 'sale') && t.referenceId) {
        if (groupedMap.has(t.referenceId.toString())) {
          const group = groupedMap.get(t.referenceId.toString())
          // Accumulate details
          group.quantity += t.quantity
          group.totalAmount = (group.totalAmount || 0) + (t.totalAmount || 0)

          // Merge items
          if (t.items && t.items.length > 0) {
            // Transaction has items array with items - merge them
            // Ensure each item has warehouseName from the transaction if not already present
            const itemsWithWarehouse = t.items.map(item => ({
              ...item,
              warehouseName: item.warehouseName || t.warehouseName
            }))
            group.items = [...(group.items || []), ...itemsWithWarehouse]
          } else {
            // Transaction has no items or empty items array - create item from transaction data
            group.items = group.items || []
            // Avoid adding duplicates if already present
            if (!group.items.some(i => i.itemName === t.itemName && i.warehouseName === t.warehouseName)) {
              group.items.push({
                itemId: t.itemId,
                itemName: t.itemName,
                quantity: t.quantity,
                warehouseName: t.warehouseName,
                unitPrice: t.unitPrice,
                costPrice: t.costPrice
              })
            }
          }

          // Add warehouse
          group.warehouses.add(t.warehouseName)
        } else {
          // New group
          const newGroup = {
            ...t,
            warehouses: new Set([t.warehouseName]),
            items: (t.items && t.items.length > 0)
              ? t.items.map(item => ({
                ...item,
                warehouseName: item.warehouseName || t.warehouseName
              }))
              : [{
                itemId: t.itemId,
                itemName: t.itemName,
                quantity: t.quantity,
                warehouseName: t.warehouseName,
                unitPrice: t.unitPrice,
                costPrice: t.costPrice
              }]
          }
          groupedMap.set(t.referenceId.toString(), newGroup)
          result.push(newGroup)
        }
      } else {
        result.push(t)
      }
    })

    console.log('=== CONSOLIDATION COMPLETE ===')
    console.log('Result count:', result.length)
    result.forEach((r, idx) => {
      console.log(`Result ${idx}:`, {
        itemName: r.itemName,
        warehouseName: r.warehouseName,
        itemsCount: r.items?.length,
        items: r.items
      })
    })

    // Post process to format warehouse name and item name
    return result.map(t => {
      if (t.warehouses) {
        // If all items use same warehouse (size === 1), show that warehouse name
        // Otherwise show warehouse count (e.g., "2 warehouses")
        const warehouseName = t.warehouses.size === 1
          ? [...t.warehouses][0]
          : `${t.warehouses.size} warehouses`

        // Keep original item name from transaction
        const itemName = t.items && t.items.length === 1
          ? t.items[0].itemName
          : t.itemName


        return {
          ...t,
          warehouseName,
          itemName
        }
      }
      return t
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'stock_in':
        return <ArrowDownToLine className="h-4 w-4" />
      case 'stock_out':
        return <ArrowUpFromLine className="h-4 w-4" />
      case 'sale':
        return <TrendingUp className="h-4 w-4" />
      case 'adjustment':
        return <Settings className="h-4 w-4" />
      case 'stock_move':
        return <ArrowLeftRight className="h-4 w-4" />
      default:
        return <List className="h-4 w-4" />
    }
  }



  const exportTransactions = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvContent = [
      ['Date', 'Type', 'Item', 'Warehouse', 'Quantity', 'Unit Price', 'Total', 'Reference', 'Notes'],
      ...filteredTransactions.map(t => [
        formatDate(t.createdAt),
        t.type.replace('_', ' '),
        t.itemName,
        t.warehouseName,
        t.quantity,
        t.unitPrice,
        t.totalAmount,
        t.reference,
        t.notes
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const viewTransactionDetails = async (transaction) => {
    // For delivery_in and delivery_out, fetch the actual delivery details
    if (transaction.type === 'delivery_in' || transaction.type === 'delivery_out') {
      try {
        const deliveryAPI = await import('../lib/api').then(m => m.deliveryAPI)
        const response = transaction.type === 'delivery_in'
          ? await deliveryAPI.getInById(transaction.referenceId)
          : await deliveryAPI.getOutById(transaction.referenceId)

        setSelectedTransaction({
          ...transaction,
          deliveryDetails: response.data
        })
      } catch (error) {
        console.error('Failed to fetch delivery details:', error)
        toast({
          title: 'Error',
          description: 'Failed to load delivery details',
          variant: 'destructive'
        })
        setSelectedTransaction(transaction)
      }
    } else {
      setSelectedTransaction(transaction)
    }
    setDetailsDialogOpen(true)
  }

  const getTransactionBadge = (type) => {
    switch (type) {
      case 'delivery_in':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <ArrowDownToLine className="mr-1 h-3 w-3" />
            Delivery In
          </Badge>
        )
      case 'delivery_out':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <ArrowUpFromLine className="mr-1 h-3 w-3" />
            Delivery Out
          </Badge>
        )
      case 'direct_sale':
        return (
          <Badge variant="default" className="bg-indigo-500 hover:bg-indigo-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            Direct Sale
          </Badge>
        )
      case 'direct_purchase':
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            <TrendingDown className="mr-1 h-3 w-3" />
            Direct Purchase
          </Badge>
        )
      case 'stock_adjust':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Settings className="mr-1 h-3 w-3" />
            Adjustment
          </Badge>
        )
      case 'stock_move':
        return (
          <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
            <ArrowLeftRight className="mr-1 h-3 w-3" />
            Stock Move
          </Badge>
        )
      // Legacy types (for old data)
      case 'purchase':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <ArrowDownToLine className="mr-1 h-3 w-3" />
            Purchase
          </Badge>
        )
      case 'sale':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
            <ArrowUpFromLine className="mr-1 h-3 w-3" />
            Sale
          </Badge>
        )
      default:
        return <Badge>{type.replace('_', ' ')}</Badge>
    }
  }

  const editTransaction = (transaction) => {
    // Only allow editing standalone transactions (not linked to sales/purchases)
    if (transaction.referenceId && transaction.referenceModel) {
      toast({
        title: 'Cannot Edit',
        description: `This transaction is linked to a ${transaction.referenceModel}. Please edit the ${transaction.referenceModel} instead.`,
        variant: 'destructive'
      })
      return
    }

    setEditingTransaction(transaction)
    setEditQuantity(transaction.quantity.toString())
    setEditNotes(transaction.notes || '')
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingTransaction) return

    const quantity = parseFloat(editQuantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity greater than 0',
        variant: 'destructive'
      })
      return
    }

    try {
      await stockTransactionAPI.update(editingTransaction._id, {
        quantity,
        notes: editNotes
      })

      toast({
        title: 'Success',
        description: 'Transaction updated successfully'
      })

      setEditDialogOpen(false)
      setEditingTransaction(null)

      // Refresh transactions
      fetchTransactions()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update transaction',
        variant: 'destructive'
      })
    }
  }

  const deleteTransaction = async (transactionId, transactionType) => {
    if (!confirm(`Are you sure you want to delete this ${transactionType.replace('_', ' ')} transaction? This will reverse the stock changes and cannot be undone.`)) {
      return
    }

    try {
      await stockTransactionAPI.delete(transactionId)
      toast({
        title: 'Success',
        description: 'Transaction deleted and stock reversed successfully'
      })
      // Refresh transactions
      const response = await stockTransactionAPI.getAll()
      setTransactions(response.data.transactions || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete transaction',
        variant: 'destructive'
      })
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

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
          <h1 className="text-3xl font-bold tracking-tight">Stock Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of all stock movements and changes
          </p>
        </div>

        <Button onClick={exportTransactions} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${dateFilter === 'custom' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Transaction Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="delivery_in">Delivery In</SelectItem>
                  <SelectItem value="delivery_out">Delivery Out</SelectItem>
                  <SelectItem value="direct_sale">Direct Sale</SelectItem>
                  <SelectItem value="direct_purchase">Direct Purchase</SelectItem>
                  <SelectItem value="stock_adjust">Adjustments</SelectItem>
                  <SelectItem value="stock_move">Stock Moves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={(value) => {
                setDateFilter(value)
                if (value !== 'custom') {
                  setStartDate('')
                  setEndDate('')
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                  />
                  <p className="text-xs text-muted-foreground">Leave end date empty for single day</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Results</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm font-medium">
                  {filteredTransactions.length} transactions • {filteredTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0)} bags
                </span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed log of all stock-related activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <List className="h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-xl mb-2">No transactions found</CardTitle>
              <CardDescription className="text-center">
                {searchTerm || typeFilter !== 'all' || dateFilter !== 'all'
                  ? 'No transactions match your current filters'
                  : 'No stock transactions recorded yet'
                }
              </CardDescription>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                      <TableCell>
                        {getTransactionBadge(transaction.type)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {transaction.itemName}
                          {transaction.items && transaction.items.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.items.length} items
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {(() => {
                              // Always compute from items for consistency
                              if (transaction.items && transaction.items.length > 0) {
                                const uniqueWarehouses = [...new Set(transaction.items.map(item => item.warehouseName).filter(Boolean))];
                                if (uniqueWarehouses.length === 1) {
                                  return uniqueWarehouses[0];
                                } else if (uniqueWarehouses.length > 1) {
                                  return `${uniqueWarehouses.length} warehouses`;
                                }
                              }
                              // Fallback to transaction-level warehouseName
                              return transaction.warehouseName || 'Unknown';
                            })()}
                          </span>
                          {transaction.toWarehouseName && (
                            <span className="text-xs text-muted-foreground">
                              → {transaction.toWarehouseName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {transaction.quantity} bags
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {transaction.reason || transaction.notes || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{transaction.staffName || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Edit button for standalone transactions only */}
                          {!transaction.referenceId && !transaction.referenceModel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editTransaction(transaction)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          {transaction.items && transaction.items.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewTransactionDetails(transaction)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTransaction(transaction._id, transaction.type)}
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
                totalItems={filteredTransactions.length}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction && (
                <>
                  {getTransactionBadge(selectedTransaction.type)} on {formatDate(selectedTransaction.createdAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && selectedTransaction.deliveryDetails ? (
            // Show delivery details for delivery_in/delivery_out
            <div className="space-y-6">
              {/* Delivery Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedTransaction.type === 'delivery_in' ? (
                  <>
                    <div>
                      <Label className="text-muted-foreground">GRN Number</Label>
                      <p className="font-mono font-medium">#{selectedTransaction.deliveryDetails.grnNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Receipt Date</Label>
                      <p className="font-medium">{formatDate(selectedTransaction.deliveryDetails.receiptDate)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Supplier</Label>
                      <p className="font-medium">{selectedTransaction.deliveryDetails.supplierName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">PO Number</Label>
                      <p className="font-mono font-medium">#{selectedTransaction.deliveryDetails.purchaseOrderNumber}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Delivery Number</Label>
                      <p className="font-mono font-medium">#{selectedTransaction.deliveryDetails.deliveryNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Delivery Date</Label>
                      <p className="font-medium">{formatDate(selectedTransaction.deliveryDetails.deliveryDate)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Client</Label>
                      <p className="font-medium">{selectedTransaction.deliveryDetails.clientName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">SO Number</Label>
                      <p className="font-mono font-medium">#{selectedTransaction.deliveryDetails.salesOrderNumber}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-3">Items {selectedTransaction.type === 'delivery_in' ? 'Received' : 'Delivered'}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Warehouse</TableHead>
                      {selectedTransaction.type === 'delivery_in' ? (
                        <>
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Total</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Selling Price</TableHead>
                          <TableHead>Total</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.deliveryDetails.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono">{item.quantity}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        {selectedTransaction.type === 'delivery_in' ? (
                          <>
                            <TableCell className="font-mono">{formatCurrency(item.costPrice)}</TableCell>
                            <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-mono">{formatCurrency(item.sellingPrice)}</TableCell>
                            <TableCell className="font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {selectedTransaction.type === 'delivery_in' && (
                      <TableRow>
                        <TableCell colSpan={3} className="font-semibold">Total Amount</TableCell>
                        <TableCell colSpan={2} className="font-mono font-bold text-lg">{formatCurrency(selectedTransaction.deliveryDetails.totalAmount)}</TableCell>
                      </TableRow>
                    )}
                    {selectedTransaction.type === 'delivery_out' && (
                      <TableRow>
                        <TableCell colSpan={3} className="font-semibold">Total Amount</TableCell>
                        <TableCell colSpan={2} className="font-mono font-bold text-lg">{formatCurrency(selectedTransaction.deliveryDetails.totalAmount)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {selectedTransaction.deliveryDetails.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1">{selectedTransaction.deliveryDetails.notes}</p>
                </div>
              )}
            </div>
          ) : selectedTransaction && selectedTransaction.items && (
            // Show regular transaction details
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Warehouse:</span>
                  <p className="font-medium">
                    {selectedTransaction.warehouseName || (() => {
                      // Fallback: compute from items if warehouseName is undefined
                      if (selectedTransaction.items && selectedTransaction.items.length > 0) {
                        const uniqueWarehouses = [...new Set(selectedTransaction.items.map(item => item.warehouseName).filter(Boolean))];
                        return uniqueWarehouses.length === 1 ? uniqueWarehouses[0] : `${uniqueWarehouses.length} warehouses`;
                      }
                      return 'Unknown';
                    })()}
                  </p>
                </div>
                {selectedTransaction.toWarehouseName && (
                  <div>
                    <span className="text-muted-foreground">To Warehouse:</span>
                    <p className="font-medium">{selectedTransaction.toWarehouseName}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <p className="font-medium">{selectedTransaction.quantity} bags</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items Count:</span>
                  <p className="font-medium">{selectedTransaction.items.length} items</p>
                </div>
              </div>

              {selectedTransaction.reason && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Reason:</span>
                  <p className="font-medium">{selectedTransaction.reason}</p>
                </div>
              )}

              {selectedTransaction.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="font-medium">{selectedTransaction.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Items Breakdown</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Quantity</TableHead>
                      {selectedTransaction.type === 'stock_adjust' && (
                        <TableHead>Adjustment Type</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTransaction.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono">{item.warehouseName || selectedTransaction.warehouseName}</TableCell>
                        <TableCell className="font-mono">{item.quantity} bags</TableCell>
                        {selectedTransaction.type === 'stock_adjust' && (
                          <TableCell>
                            <Badge variant={item.adjustmentType === 'increase' ? 'default' : 'destructive'}>
                              {item.adjustmentType === 'increase' ? '+' : '-'} {item.adjustmentType}
                            </Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              {editingTransaction && (
                <>
                  {getTransactionBadge(editingTransaction.type)} - {editingTransaction.itemName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {editingTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction Type (Read-only)</Label>
                <Input
                  value={editingTransaction.type.replace('_', ' ').toUpperCase()}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Item Name (Read-only)</Label>
                <Input
                  value={editingTransaction.itemName}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Warehouse (Read-only)</Label>
                <Input
                  value={editingTransaction.warehouseName || 'Unknown'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity *</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockTransactions
