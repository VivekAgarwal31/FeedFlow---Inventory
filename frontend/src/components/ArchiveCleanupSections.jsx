// Archive Section Component
import React, { useState } from 'react'
import { Archive, Loader2 } from 'lucide-react'
import { dataManagementAPI } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'

export const ArchiveSection = ({ toast }) => {
    const [loading, setLoading] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState('stockTransactions')
    const [cutoffDate, setCutoffDate] = useState('')
    const [archiveStats, setArchiveStats] = useState(null)

    const archiveEntities = [
        { value: 'stockTransactions', label: 'Stock Transactions' },
        { value: 'sales', label: 'Sales' },
        { value: 'purchases', label: 'Purchases' }
    ]

    const fetchArchiveStats = async () => {
        try {
            const response = await dataManagementAPI.getArchiveStats()
            setArchiveStats(response.data.stats)
        } catch (error) {
            console.error('Failed to fetch archive stats:', error)
        }
    }

    React.useEffect(() => {
        fetchArchiveStats()
    }, [])

    const handleArchive = async () => {
        if (!cutoffDate) {
            toast({
                title: 'Date required',
                description: 'Please select a cutoff date',
                variant: 'destructive'
            })
            return
        }

        if (!confirm(`Archive all ${selectedEntity} older than ${cutoffDate}? This will move them to archive storage.`)) {
            return
        }

        try {
            setLoading(true)
            const response = await dataManagementAPI.archiveRecords(selectedEntity, cutoffDate)
            toast({
                title: 'Archive completed',
                description: `Archived ${response.data.recordCount} records`
            })
            fetchArchiveStats()
            setCutoffDate('')
        } catch (error) {
            toast({
                title: 'Archive failed',
                description: error.response?.data?.message || 'Failed to archive records',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Archival</CardTitle>
                <CardDescription>
                    Archive old records to keep your database performant
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Archive Stats */}
                {archiveStats && Object.keys(archiveStats).length > 0 && (
                    <Alert>
                        <Archive className="h-4 w-4" />
                        <AlertDescription>
                            <p className="font-medium mb-2">Archive Statistics:</p>
                            {Object.entries(archiveStats).map(([entity, stats]) => (
                                <p key={entity} className="text-sm">
                                    {entity}: {stats.totalArchived} records archived
                                    {stats.lastArchived && ` (Last: ${new Date(stats.lastArchived).toLocaleDateString()})`}
                                </p>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Archive Controls */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="archiveEntity">Data Type</Label>
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger id="archiveEntity">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {archiveEntities.map(entity => (
                                    <SelectItem key={entity.value} value={entity.value}>
                                        {entity.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cutoffDate">Archive records older than</Label>
                        <Input
                            id="cutoffDate"
                            type="date"
                            value={cutoffDate}
                            onChange={(e) => setCutoffDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground">
                            Records older than this date will be moved to archive
                        </p>
                    </div>

                    <Button
                        onClick={handleArchive}
                        disabled={loading || !cutoffDate}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Archiving...
                            </>
                        ) : (
                            <>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive Old Records
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Cleanup Section Component
export const CleanupSection = ({ toast }) => {
    const [loading, setLoading] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const [cleanupHistory, setCleanupHistory] = useState([])
    const [showHistory, setShowHistory] = useState(false)

    const analyzeDatabase = async () => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.analyzeCleanup()
            setAnalysis(response.data)
            toast({
                title: 'Analysis complete',
                description: `Found ${response.data.orphaned.summary.totalOrphaned} issues`
            })
        } catch (error) {
            toast({
                title: 'Analysis failed',
                description: error.response?.data?.message || 'Failed to analyze database',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const executeCleanup = async (dryRun = true) => {
        if (!dryRun && !confirm('Are you sure you want to execute cleanup? This will permanently delete orphaned records!')) {
            return
        }

        try {
            setLoading(true)
            const response = await dataManagementAPI.executeCleanup(dryRun)

            if (dryRun) {
                toast({
                    title: 'Dry run complete',
                    description: `Would delete ${response.data.wouldDelete} records`
                })
            } else {
                toast({
                    title: 'Cleanup complete',
                    description: `Deleted ${response.data.deleted} orphaned records`
                })
                setAnalysis(null)
                fetchCleanupHistory()
            }
        } catch (error) {
            toast({
                title: 'Cleanup failed',
                description: error.response?.data?.message || 'Failed to execute cleanup',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const optimizeDatabase = async () => {
        if (!confirm('Optimize database? This will rebuild indexes and may take a few minutes.')) {
            return
        }

        try {
            setLoading(true)
            await dataManagementAPI.optimizeDatabase()
            toast({
                title: 'Optimization complete',
                description: 'Database indexes rebuilt successfully'
            })
        } catch (error) {
            toast({
                title: 'Optimization failed',
                description: error.response?.data?.message || 'Failed to optimize database',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchCleanupHistory = async () => {
        try {
            const response = await dataManagementAPI.getCleanupHistory()
            setCleanupHistory(response.data.history)
        } catch (error) {
            console.error('Failed to fetch cleanup history:', error)
        }
    }

    React.useEffect(() => {
        fetchCleanupHistory()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Database Cleanup</CardTitle>
                <CardDescription>
                    Analyze and clean up orphaned records and duplicates
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button onClick={analyzeDatabase} disabled={loading} variant="outline">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Analyze Database
                    </Button>
                    <Button onClick={optimizeDatabase} disabled={loading} variant="outline">
                        <Database className="mr-2 h-4 w-4" />
                        Optimize Database
                    </Button>
                </div>

                {analysis && (
                    <div className="space-y-4">
                        <Alert variant={analysis.orphaned.summary.totalOrphaned > 0 ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-medium mb-2">Found {analysis.orphaned.summary.totalOrphaned} orphaned records</p>
                                <div className="text-sm space-y-1">
                                    {analysis.orphaned.details.orphanedStockItems.length > 0 && <p>• Stock Items: {analysis.orphaned.details.orphanedStockItems.length}</p>}
                                    {analysis.orphaned.details.orphanedSales.length > 0 && <p>• Sales: {analysis.orphaned.details.orphanedSales.length}</p>}
                                    {analysis.orphaned.details.orphanedPurchases.length > 0 && <p>• Purchases: {analysis.orphaned.details.orphanedPurchases.length}</p>}
                                    {analysis.orphaned.details.orphanedTransactions.length > 0 && <p>• Transactions: {analysis.orphaned.details.orphanedTransactions.length}</p>}
                                </div>
                            </AlertDescription>
                        </Alert>

                        {Object.values(analysis.duplicates).some(arr => arr.length > 0) && (
                            <Alert>
                                <AlertDescription>
                                    <p className="font-medium mb-2">Duplicates Found:</p>
                                    <div className="text-sm space-y-1">
                                        {analysis.duplicates.clients.length > 0 && <p>• Clients: {analysis.duplicates.clients.length} duplicates</p>}
                                        {analysis.duplicates.suppliers.length > 0 && <p>• Suppliers: {analysis.duplicates.suppliers.length} duplicates</p>}
                                        {analysis.duplicates.warehouses.length > 0 && <p>• Warehouses: {analysis.duplicates.warehouses.length} duplicates</p>}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {analysis.orphaned.summary.totalOrphaned > 0 && (
                            <div className="flex gap-3">
                                <Button onClick={() => executeCleanup(true)} disabled={loading} variant="outline" className="flex-1">
                                    Dry Run (Preview)
                                </Button>
                                <Button onClick={() => executeCleanup(false)} disabled={loading} variant="destructive" className="flex-1">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Execute Cleanup
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Button onClick={() => setShowHistory(!showHistory)} variant="ghost" size="sm" className="w-full">
                        {showHistory ? 'Hide' : 'Show'} Cleanup History
                    </Button>

                    {showHistory && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {cleanupHistory.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No cleanup history</p>
                            ) : (
                                cleanupHistory.map((log) => (
                                    <div key={log._id} className="p-3 border rounded-lg text-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium capitalize">{log.cleanupType}</p>
                                                <p className="text-xs text-muted-foreground">{log.recordsAffected} records affected</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
