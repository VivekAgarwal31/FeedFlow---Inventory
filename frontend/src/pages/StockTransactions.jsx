import React, { useState, useEffect } from 'react'
import { List, Calendar, Filter, Download, Search, ArrowUpFromLine, ArrowDownToLine, Settings, ArrowLeftRight, TrendingUp } from 'lucide-react'
import { stockTransactionAPI } from '../lib/api'
import { formatCurrency, formatDate } from '../lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'

const StockTransactions = () => {
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
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

    setFilteredTransactions(filtered)
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

  const getTransactionBadge = (type) => {
    const variants = {
      stock_in: 'default',
      stock_out: 'destructive',
      sale: 'default',
      adjustment: 'secondary',
      stock_move: 'outline'
    }

    const labels = {
      stock_in: 'Stock In',
      stock_out: 'Stock Out',
      sale: 'Sale',
      adjustment: 'Adjustment',
      stock_move: 'Move'
    }

    return (
      <Badge variant={variants[type]} className="gap-1">
        {getTransactionIcon(type)}
        {labels[type]}
      </Badge>
    )
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.itemName}
                    </TableCell>
                    <TableCell>
                      {transaction.warehouseName}
                    </TableCell>
                    <TableCell className="font-mono">
                      {transaction.quantity} bags
                    </TableCell>
                    <TableCell className="font-mono">
                      {transaction.unitPrice > 0 ? formatCurrency(transaction.unitPrice) : '-'}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {transaction.totalAmount > 0 ? formatCurrency(transaction.totalAmount) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {transaction.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StockTransactions
