import React, { useState, useRef } from 'react'
import { Download, Upload, FileDown, Database, Archive, Trash2, Loader2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'
import { dataManagementAPI } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'

const DataManagementTab = ({ user }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState('stockItems')
    const [importFile, setImportFile] = useState(null)
    const [importResult, setImportResult] = useState(null)
    const fileInputRef = useRef(null)

    const entities = [
        { value: 'stockItems', label: 'Stock Items' },
        { value: 'sales', label: 'Sales' },
        { value: 'purchases', label: 'Purchases' },
        { value: 'clients', label: 'Clients' },
        { value: 'suppliers', label: 'Suppliers' },
        { value: 'warehouses', label: 'Warehouses' },
        { value: 'stockTransactions', label: 'Stock Transactions' }
    ]

    // Helper function to download blob
    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    // Export handlers
    const handleExport = async (format) => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.exportData(selectedEntity, format)
            const extension = format === 'csv' ? 'csv' : 'xlsx'
            downloadBlob(response.data, `${selectedEntity}_${Date.now()}.${extension}`)
            toast({
                title: 'Export successful',
                description: `${selectedEntity} exported as ${format.toUpperCase()}`
            })
        } catch (error) {
            toast({
                title: 'Export failed',
                description: error.response?.data?.message || 'Failed to export data',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.downloadTemplate(selectedEntity, 'excel')
            downloadBlob(response.data, `${selectedEntity}_template.xlsx`)
            toast({
                title: 'Template downloaded',
                description: 'Import template downloaded successfully'
            })
        } catch (error) {
            toast({
                title: 'Download failed',
                description: 'Failed to download template',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    // Import handler
    const handleImport = async () => {
        if (!importFile) {
            toast({
                title: 'No file selected',
                description: 'Please select a file to import',
                variant: 'destructive'
            })
            return
        }

        try {
            setLoading(true)
            setImportResult(null)
            const response = await dataManagementAPI.importData(selectedEntity, importFile)
            setImportResult(response.data)
            setImportFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            toast({
                title: 'Import completed',
                description: `Successfully imported ${response.data.success} records`
            })
        } catch (error) {
            const errorData = error.response?.data
            setImportResult(errorData)
            toast({
                title: 'Import failed',
                description: errorData?.message || 'Failed to import data',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImportFile(file)
            setImportResult(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Export/Import Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Export & Import Data</CardTitle>
                    <CardDescription>
                        Export your data to CSV or Excel files, or import data from files
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Entity Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="entity">Select Data Type</Label>
                        <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                            <SelectTrigger id="entity">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {entities.map(entity => (
                                    <SelectItem key={entity.value} value={entity.value}>
                                        {entity.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export Buttons */}
                    <div className="space-y-2">
                        <Label>Export</Label>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => handleExport('csv')}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export as CSV
                            </Button>
                            <Button
                                onClick={() => handleExport('excel')}
                                disabled={loading}
                                variant="outline"
                                className="flex-1"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export as Excel
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Import Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Import</Label>
                            <Button
                                onClick={handleDownloadTemplate}
                                disabled={loading}
                                variant="ghost"
                                size="sm"
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-white
                  hover:file:bg-primary/90
                  cursor-pointer"
                            />
                            {importFile && (
                                <p className="text-sm text-muted-foreground">
                                    Selected: {importFile.name}
                                </p>
                            )}
                            <Button
                                onClick={handleImport}
                                disabled={loading || !importFile}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Import Data
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Import Results */}
                        {importResult && (
                            <Alert variant={importResult.success > 0 ? 'default' : 'destructive'}>
                                {importResult.success > 0 ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4" />
                                )}
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <p className="font-medium">
                                            {importResult.message || 'Import completed'}
                                        </p>
                                        {importResult.success !== undefined && (
                                            <p className="text-sm">
                                                Success: {importResult.success} | Failed: {importResult.failed || 0}
                                            </p>
                                        )}
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div className="mt-2 max-h-40 overflow-y-auto">
                                                <p className="text-sm font-medium mb-1">Errors:</p>
                                                {importResult.errors.slice(0, 5).map((err, idx) => (
                                                    <p key={idx} className="text-xs">
                                                        Row {err.row}: {err.field} - {err.error}
                                                    </p>
                                                ))}
                                                {importResult.errors.length > 5 && (
                                                    <p className="text-xs mt-1">
                                                        ...and {importResult.errors.length - 5} more errors
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Backup Section - Only for Owner */}
            {user?.role === 'owner' && (
                <BackupSection toast={toast} downloadBlob={downloadBlob} />
            )}

            {/* Archive Section */}
            <ArchiveSection toast={toast} />

            {/* Cleanup Section - Only for Owner */}
            {user?.role === 'owner' && (
                <CleanupSection toast={toast} />
            )}
        </div>
    )
}

// Backup Section Component
const BackupSection = ({ toast, downloadBlob }) => {
    const [loading, setLoading] = useState(false)
    const [backups, setBackups] = useState([])
    const [loadingBackups, setLoadingBackups] = useState(false)

    const fetchBackups = async () => {
        try {
            setLoadingBackups(true)
            const response = await dataManagementAPI.listBackups()
            console.log('Backup API Response:', response)
            console.log('Backups data:', response.data)
            console.log('Backups array:', response.data.backups)
            setBackups(response.data.backups || [])
        } catch (error) {
            console.error('Fetch backups error:', error)
            toast({
                title: 'Failed to load backups',
                description: error.response?.data?.message || 'Error loading backup list',
                variant: 'destructive'
            })
        } finally {
            setLoadingBackups(false)
        }
    }

    React.useEffect(() => {
        fetchBackups()
    }, [])

    const handleCreateBackup = async () => {
        try {
            setLoading(true)
            console.log('Creating backup...')
            const response = await dataManagementAPI.createBackup()
            console.log('Backup created response:', response)
            toast({
                title: 'Backup created',
                description: 'Database backup created successfully'
            })
            await fetchBackups()
        } catch (error) {
            console.error('Create backup error:', error)
            toast({
                title: 'Backup failed',
                description: error.response?.data?.message || 'Failed to create backup',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadBackup = async (backupId, fileName) => {
        try {
            const response = await dataManagementAPI.downloadBackup(backupId)
            downloadBlob(response.data, fileName)
            toast({
                title: 'Download started',
                description: 'Backup file download started'
            })
        } catch (error) {
            toast({
                title: 'Download failed',
                description: 'Failed to download backup',
                variant: 'destructive'
            })
        }
    }

    const handleRestoreBackup = async (backupId) => {
        if (!confirm('Are you sure you want to restore this backup? This will replace all current data!')) {
            return
        }

        try {
            setLoading(true)
            await dataManagementAPI.restoreBackup(backupId)
            toast({
                title: 'Restore completed',
                description: 'Database restored successfully. Please refresh the page.'
            })
        } catch (error) {
            toast({
                title: 'Restore failed',
                description: error.response?.data?.message || 'Failed to restore backup',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteBackup = async (backupId) => {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return
        }

        try {
            await dataManagementAPI.deleteBackup(backupId)
            toast({
                title: 'Backup deleted',
                description: 'Backup file deleted successfully'
            })
            fetchBackups()
        } catch (error) {
            toast({
                title: 'Delete failed',
                description: 'Failed to delete backup',
                variant: 'destructive'
            })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>
                    Create backups of your data and restore when needed
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleCreateBackup}
                    disabled={loading}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Backup...
                        </>
                    ) : (
                        <>
                            <Database className="mr-2 h-4 w-4" />
                            Create Backup Now
                        </>
                    )}
                </Button>

                <div className="space-y-2">
                    <Label>Backup History</Label>
                    {loadingBackups ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : backups.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No backups found
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {backups.map(backup => (
                                <div
                                    key={backup._id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{backup.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(backup.createdAt).toLocaleString()} • {(backup.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadBackup(backup.backupId, backup.fileName)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRestoreBackup(backup.backupId)}
                                        >
                                            Restore
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDeleteBackup(backup.backupId)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// Archive Section Component
const ArchiveSection = ({ toast }) => {
    const [loading, setLoading] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState('stockTransactions')
    const [cutoffDate, setCutoffDate] = useState('')
    const [archiveStats, setArchiveStats] = useState(null)
    const [archivedRecords, setArchivedRecords] = useState([])
    const [selectedRecords, setSelectedRecords] = useState(new Set())
    const [showArchived, setShowArchived] = useState(false)

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

    const fetchArchivedRecords = async () => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.getArchivedRecords(selectedEntity)
            setArchivedRecords(response.data.records || [])
            setSelectedRecords(new Set())
            setShowArchived(true)
        } catch (error) {
            toast({
                title: 'Failed to load archived records',
                description: error.response?.data?.message || 'Error loading archived records',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const toggleRecordSelection = (recordId) => {
        const newSelected = new Set(selectedRecords)
        if (newSelected.has(recordId)) {
            newSelected.delete(recordId)
        } else {
            newSelected.add(recordId)
        }
        setSelectedRecords(newSelected)
    }

    const toggleSelectAll = () => {
        if (selectedRecords.size === archivedRecords.length) {
            setSelectedRecords(new Set())
        } else {
            setSelectedRecords(new Set(archivedRecords.map(r => r._id)))
        }
    }

    const restoreSelected = async () => {
        if (selectedRecords.size === 0) {
            toast({
                title: 'No records selected',
                description: 'Please select records to restore',
                variant: 'destructive'
            })
            return
        }

        if (!confirm(`Restore ${selectedRecords.size} selected records?`)) {
            return
        }

        try {
            setLoading(true)
            const response = await dataManagementAPI.restoreFromArchive(selectedEntity, Array.from(selectedRecords))
            toast({
                title: 'Restore complete',
                description: `Restored ${response.data.restored} records`
            })
            fetchArchiveStats()
            setShowArchived(false)
            setArchivedRecords([])
            setSelectedRecords(new Set())
        } catch (error) {
            toast({
                title: 'Restore failed',
                description: error.response?.data?.message || 'Failed to restore records',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
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

                    {/* Restore Section */}
                    <div className="border-t pt-4 mt-4 space-y-4">
                        <div>
                            <h4 className="font-medium mb-1">Restore Archived Records</h4>
                            <p className="text-xs text-muted-foreground">
                                Bring back archived records to the main database
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="restoreCutoffDate">Restore records archived before</Label>
                            <Input
                                id="restoreCutoffDate"
                                type="date"
                                value={cutoffDate}
                                onChange={(e) => setCutoffDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                            <p className="text-xs text-muted-foreground">
                                Archived records from before this date will be restored
                            </p>
                        </div>

                        <Button
                            onClick={async () => {
                                if (!cutoffDate) {
                                    toast({
                                        title: 'Date required',
                                        description: 'Please select a cutoff date',
                                        variant: 'destructive'
                                    })
                                    return
                                }

                                if (!confirm(`Restore all archived ${selectedEntity} from before ${cutoffDate}?`)) {
                                    return
                                }

                                try {
                                    setLoading(true)
                                    const response = await dataManagementAPI.restoreArchive(selectedEntity, cutoffDate)
                                    toast({
                                        title: 'Restore complete',
                                        description: `Restored ${response.data.restored} records`
                                    })
                                    fetchArchiveStats()
                                    setCutoffDate('')
                                } catch (error) {
                                    toast({
                                        title: 'Restore failed',
                                        description: error.response?.data?.message || 'Failed to restore records',
                                        variant: 'destructive'
                                    })
                                } finally {
                                    setLoading(false)
                                }
                            }}
                            disabled={loading || !cutoffDate}
                            variant="outline"
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore Archived Records
                                </>
                            )}
                        </Button>

                        <div className="flex gap-2">
                            <Button
                                onClick={fetchArchivedRecords}
                                disabled={loading}
                                variant="secondary"
                                className="flex-1"
                            >
                                <Database className="mr-2 h-4 w-4" />
                                View Archived Records
                            </Button>
                        </div>

                        {/* Archived Records List */}
                        {showArchived && (
                            <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">
                                        Archived {archiveEntities.find(e => e.value === selectedEntity)?.label} ({archivedRecords.length})
                                    </h4>
                                    <Button
                                        onClick={() => setShowArchived(false)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Close
                                    </Button>
                                </div>

                                {archivedRecords.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No archived records found
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                            <input
                                                type="checkbox"
                                                checked={selectedRecords.size === archivedRecords.length && archivedRecords.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4"
                                            />
                                            <span className="text-sm font-medium">
                                                Select All ({selectedRecords.size} selected)
                                            </span>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                            {archivedRecords.map((record) => (
                                                <div
                                                    key={record._id}
                                                    className="flex items-center gap-2 p-2 hover:bg-muted rounded text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRecords.has(record._id)}
                                                        onChange={() => toggleRecordSelection(record._id)}
                                                        className="h-4 w-4"
                                                    />
                                                    <div className="flex-1">
                                                        {selectedEntity === 'stockTransactions' && (
                                                            <span>{record.type}: {record.itemName} - Qty: {record.quantity}</span>
                                                        )}
                                                        {selectedEntity === 'sales' && (
                                                            <span>{record.clientName} - ₹{record.totalAmount}</span>
                                                        )}
                                                        {selectedEntity === 'purchases' && (
                                                            <span>{record.supplierName} - ₹{record.totalAmount}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            onClick={restoreSelected}
                                            disabled={loading || selectedRecords.size === 0}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Restoring...
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Restore Selected ({selectedRecords.size})
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Cleanup Section Component
const CleanupSection = ({ toast }) => {
    const [loading, setLoading] = useState(false)
    const [analysis, setAnalysis] = useState(null)
    const [dryRunResults, setDryRunResults] = useState(null)
    const [cleanupHistory, setCleanupHistory] = useState([]
    )
    const [showHistory, setShowHistory] = useState(false)

    const analyzeDatabase = async () => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.analyzeCleanup()
            setAnalysis(response.data)
            setDryRunResults(null) // Clear previous dry-run results
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
                setDryRunResults(response.data)
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
                setDryRunResults(null)
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

                        {dryRunResults && (
                            <div className="space-y-4">
                                <Alert>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription>
                                        <p className="font-medium">Dry Run Results - Found {dryRunResults.wouldDelete} Orphaned Records</p>
                                        <p className="text-xs mt-1 text-muted-foreground">
                                            Select records to delete or click "Delete All" to remove all orphaned records.
                                        </p>
                                    </AlertDescription>
                                </Alert>

                                {/* Stock Items */}
                                {dryRunResults.details.orphanedStockItems?.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                        <h4 className="font-medium mb-2">Orphaned Stock Items ({dryRunResults.details.orphanedStockItems.length})</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {dryRunResults.details.orphanedStockItems.map((item) => (
                                                <div key={item._id} className="text-sm flex items-center gap-2 p-1 hover:bg-muted rounded">
                                                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                                                    <span>{item.itemName}</span>
                                                    <span className="text-xs text-muted-foreground">(Invalid warehouse)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sales */}
                                {dryRunResults.details.orphanedSales?.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                        <h4 className="font-medium mb-2">Orphaned Sales ({dryRunResults.details.orphanedSales.length})</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {dryRunResults.details.orphanedSales.map((sale) => (
                                                <div key={sale._id} className="text-sm flex items-center gap-2 p-1 hover:bg-muted rounded">
                                                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                                                    <span>{sale.clientName}</span>
                                                    <span className="text-xs text-muted-foreground">₹{sale.totalAmount} (Deleted client)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Purchases */}
                                {dryRunResults.details.orphanedPurchases?.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                        <h4 className="font-medium mb-2">Orphaned Purchases ({dryRunResults.details.orphanedPurchases.length})</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {dryRunResults.details.orphanedPurchases.map((purchase) => (
                                                <div key={purchase._id} className="text-sm flex items-center gap-2 p-1 hover:bg-muted rounded">
                                                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                                                    <span>{purchase.supplierName}</span>
                                                    <span className="text-xs text-muted-foreground">₹{purchase.totalAmount} (Deleted supplier)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Transactions */}
                                {dryRunResults.details.orphanedTransactions?.length > 0 && (
                                    <div className="border rounded-lg p-3">
                                        <h4 className="font-medium mb-2">Orphaned Transactions ({dryRunResults.details.orphanedTransactions.length})</h4>
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {dryRunResults.details.orphanedTransactions.map((txn) => (
                                                <div key={txn._id} className="text-sm flex items-center gap-2 p-1 hover:bg-muted rounded">
                                                    <input type="checkbox" className="h-4 w-4" defaultChecked />
                                                    <span>{txn.type}: {txn.itemName}</span>
                                                    <span className="text-xs text-muted-foreground">(Invalid reference)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button onClick={() => executeCleanup(false)} disabled={loading} variant="destructive" className="flex-1">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete All ({dryRunResults.wouldDelete})
                                    </Button>
                                    <Button onClick={() => setDryRunResults(null)} variant="outline" className="flex-1">
                                        Cancel
                                    </Button>
                                </div>
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

export default DataManagementTab
