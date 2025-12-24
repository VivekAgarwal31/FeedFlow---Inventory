import React, { useState, useEffect } from 'react'
import { List, Calendar, Filter, Download, Search, ArrowUpFromLine, ArrowDownToLine, Settings, ArrowLeftRight, TrendingUp, Eye, Trash2 } from 'lucide-react'
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
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
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
  }, [transactions, searchTerm, typeFilter, dateFilter])

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
      filtered = filtered.filter(transaction =>
        transaction.itemId?.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.warehouseId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter)
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      let filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        default:
          filterDate = null
      }

      if (filterDate) {
        filtered = filtered.filter(transaction =>
          new Date(transaction.transactionDate || transaction.createdAt) >= filterDate
        )
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

  const viewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction)
    setDetailsDialogOpen(true)
  }

  const getTransactionBadge = (type) => {
    switch (type) {
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
      case 'adjustment':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            <Settings className="mr-1 h-3 w-3" />
            Adjustment
          </Badge>
        )
      case 'transfer':
        return (
          <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
            <ArrowLeftRight className="mr-1 h-3 w-3" />
            Transfer
          </Badge>
        )
      default:
        return <Badge>{type}</Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="stock_in">Stock In</SelectItem>
                  <SelectItem value="stock_out">Stock Out</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="stock_adjust">Adjustments</SelectItem>
                  <SelectItem value="stock_move">Stock Moves</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Results</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm font-medium">
                  {filteredTransactions.length} transactions
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
                          <span>{transaction.warehouseName}</span>
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
        <DialogContent className="max-w-2xl">
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

          {selectedTransaction && selectedTransaction.items && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Warehouse:</span>
                  <p className="font-medium">{selectedTransaction.warehouseName}</p>
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
                    {(() => {
                      console.log('=== RENDERING TRANSACTION ITEMS ===')
                      console.log('Selected transaction:', selectedTransaction)
                      console.log('Items:', selectedTransaction.items)
                      selectedTransaction.items.forEach((item, idx) => {
                        console.log(`Item ${idx}:`, {
                          itemName: item.itemName,
                          warehouseName: item.warehouseName,
                          fallback: selectedTransaction.warehouseName
                        })
                      })
                      return null
                    })()}
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
    </div>
  )
}

export default StockTransactions
