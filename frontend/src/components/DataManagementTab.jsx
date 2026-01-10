import React, { useState } from 'react'
import { Download, Database, Trash2, Loader2 } from 'lucide-react'
import { dataManagementAPI } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'
import { useAuth } from '../contexts/AuthContext'

const DataManagementTab = ({ user }) => {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState('stockItems')

    // Determine delivery mode
    const isDirectMode = user?.companyId?.deliveryMode === 'direct'

    // Dynamic entities based on delivery mode
    const entities = [
        { value: 'stockItems', label: 'Stock Items' },
        // Direct mode: Stock In/Out
        ...(isDirectMode ? [
            { value: 'purchases', label: 'Stock In (Direct Purchase)' },
            { value: 'sales', label: 'Stock Out (Direct Sale)' },
        ] : [
            // Order-based mode: Orders and Deliveries
            { value: 'salesOrders', label: 'Sales Order' },
            { value: 'purchaseOrders', label: 'Purchase Order' },
            { value: 'deliveryOuts', label: 'Delivery Out' },
            { value: 'deliveryIns', label: 'Delivery In' },
        ]),
        { value: 'clients', label: 'Clients' },
        { value: 'suppliers', label: 'Suppliers' },
        { value: 'warehouses', label: 'Warehouses' },
        { value: 'stockTransactions', label: 'Stock Transactions' }
    ]

    // Ensure selected entity is valid when delivery mode changes
    React.useEffect(() => {
        const entityValues = entities.map(e => e.value)
        if (!entityValues.includes(selectedEntity)) {
            setSelectedEntity('stockItems')
        }
    }, [isDirectMode])

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


    return (
        <div className="space-y-6">
            {/* Export/Import Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>
                        Export your data to CSV or Excel files
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
                </CardContent>
            </Card>

            {/* Backup Section - Only for Owner */}
            {user?.role === 'owner' && (
                <BackupSection toast={toast} downloadBlob={downloadBlob} />
            )}
        </div>
    )
}

// Backup Section Component
const BackupSection = ({ toast, downloadBlob }) => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [backups, setBackups] = useState([])
    const [restores, setRestores] = useState([])
    const [loadingBackups, setLoadingBackups] = useState(false)

    // Restore state
    const [backupFile, setBackupFile] = useState(null)
    const [backupData, setBackupData] = useState(null)
    const [validated, setValidated] = useState(false)
    const [metadata, setMetadata] = useState(null)
    const [warnings, setWarnings] = useState([])
    const [selectedModules, setSelectedModules] = useState([])
    const [confirmationPhrase, setConfirmationPhrase] = useState('')
    const [showRestoreHistory, setShowRestoreHistory] = useState(false)

    const modules = [
        { value: 'stockItems', label: 'Stock Items' },
        { value: 'sales', label: 'Sales' },
        { value: 'purchases', label: 'Purchases' },
        { value: 'clients', label: 'Clients' },
        { value: 'suppliers', label: 'Suppliers' },
        { value: 'warehouses', label: 'Warehouses' },
        { value: 'stockTransactions', label: 'Stock Transactions' },
        { value: 'users', label: 'Users' },
        { value: 'salesOrders', label: 'Sales Orders' },
        { value: 'purchaseOrders', label: 'Purchase Orders' },
        { value: 'deliveryOuts', label: 'Delivery Out' },
        { value: 'deliveryIns', label: 'Delivery In' }
    ]

    const fetchBackups = async () => {
        try {
            setLoadingBackups(true)
            const response = await dataManagementAPI.getBackupHistory()
            setBackups(response.data.backups || [])
        } catch (error) {
            console.error('Fetch backups error:', error)
        } finally {
            setLoadingBackups(false)
        }
    }

    const fetchRestores = async () => {
        try {
            const response = await dataManagementAPI.getRestoreHistory()
            setRestores(response.data.restores || [])
        } catch (error) {
            console.error('Fetch restores error:', error)
        }
    }

    React.useEffect(() => {
        fetchBackups()
        fetchRestores()
    }, [])

    const handleCreateBackup = async () => {
        try {
            setLoading(true)
            const response = await dataManagementAPI.createBackup()

            // Download the backup file
            const blob = new Blob([JSON.stringify(response.data.data, null, 2)],
                { type: 'application/json' })
            downloadBlob(blob, response.data.fileName)

            toast({
                title: 'Backup downloaded',
                description: 'Your backup has been created and downloaded successfully'
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setBackupFile(file)
        setValidated(false)
        setMetadata(null)
        setWarnings([])
        setSelectedModules([])
        setConfirmationPhrase('')

        // Read and parse file
        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result)
                setBackupData(data)

                // Validate
                const response = await dataManagementAPI.validateBackup(file)
                setMetadata(response.data.metadata)
                setWarnings(response.data.warnings || [])
                setValidated(true)

                toast({
                    title: 'Backup validated',
                    description: 'Backup file is valid and ready to restore'
                })
            } catch (error) {
                toast({
                    title: 'Invalid backup file',
                    description: error.response?.data?.message || 'Failed to validate backup file',
                    variant: 'destructive'
                })
                setBackupFile(null)
                setBackupData(null)
            }
        }
        reader.readAsText(file)
    }

    const toggleModule = (moduleValue) => {
        setSelectedModules(prev =>
            prev.includes(moduleValue)
                ? prev.filter(m => m !== moduleValue)
                : [...prev, moduleValue]
        )
    }

    const handleRestore = async () => {
        if (selectedModules.length === 0) {
            toast({
                title: 'No modules selected',
                description: 'Please select at least one module to restore',
                variant: 'destructive'
            })
            return
        }

        if (confirmationPhrase !== user?.companyId?.name) {
            toast({
                title: 'Incorrect confirmation',
                description: 'Please type your company name exactly to confirm',
                variant: 'destructive'
            })
            return
        }

        try {
            setLoading(true)
            await dataManagementAPI.restorePartial(backupData, selectedModules, confirmationPhrase)

            toast({
                title: 'Restore completed',
                description: `Successfully restored ${selectedModules.length} module(s). Please refresh the page.`
            })

            // Reset form
            setBackupFile(null)
            setBackupData(null)
            setValidated(false)
            setMetadata(null)
            setSelectedModules([])
            setConfirmationPhrase('')

            await fetchRestores()
        } catch (error) {
            console.error('Restore error:', error)
            toast({
                title: 'Restore failed',
                description: error.response?.data?.message || 'Failed to restore data',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Create Backup */}
            <Card>
                <CardHeader>
                    <CardTitle>Create Backup</CardTitle>
                    <CardDescription>
                        Download a complete snapshot of your company data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Database className="h-4 w-4" />
                        <AlertDescription>
                            Backup includes: Stock Items, Sales, Purchases, Clients, Suppliers,
                            Warehouses, Stock Transactions, Users, and all order/delivery data
                        </AlertDescription>
                    </Alert>

                    <Button onClick={handleCreateBackup} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Backup...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Create & Download Backup
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Backup History */}
            <Card>
                <CardHeader>
                    <CardTitle>Backup History</CardTitle>
                    <CardDescription>
                        View all backups created for your company
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingBackups ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : backups.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            No backups found. Create your first backup above.
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
                                            {new Date(backup.createdAt).toLocaleString()} •
                                            Created by {backup.createdBy?.fullName || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {backup.recordCounts?.stockItems || 0} items, {backup.recordCounts?.sales || 0} sales,
                                            {backup.recordCounts?.clients || 0} clients
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Restore Data */}
            <Card>
                <CardHeader>
                    <CardTitle>Restore Data</CardTitle>
                    <CardDescription>
                        Restore specific data from a backup file
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!backupFile && (
                        <div>
                            <Label htmlFor="backupFile">Upload Backup File</Label>
                            <Input
                                id="backupFile"
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="mt-2"
                            />
                        </div>
                    )}

                    {backupFile && !validated && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Validating backup file...</AlertDescription>
                        </Alert>
                    )}

                    {validated && metadata && (
                        <div className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    <p className="font-medium">Backup Information:</p>
                                    <p className="text-sm">Created: {new Date(metadata.createdAt).toLocaleString()}</p>
                                    <p className="text-sm">Company: {metadata.companyName}</p>
                                    {warnings.length > 0 && (
                                        <div className="mt-2">
                                            {warnings.map((warning, idx) => (
                                                <p key={idx} className="text-xs text-yellow-600">⚠️ {warning}</p>
                                            ))}
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>

                            <div>
                                <Label>Select data to restore:</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {modules.map(module => (
                                        <div key={module.value} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={module.value}
                                                checked={selectedModules.includes(module.value)}
                                                onChange={() => toggleModule(module.value)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor={module.value} className="text-sm font-normal cursor-pointer">
                                                {module.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Alert variant="destructive">
                                <AlertDescription>
                                    <strong>WARNING:</strong> This will REPLACE the selected data with backup data.
                                    Current data will be deleted.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <Label htmlFor="confirmation">Type company name to confirm</Label>
                                <Input
                                    id="confirmation"
                                    placeholder={user?.companyId?.name}
                                    value={confirmationPhrase}
                                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                                    className="mt-2"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={handleRestore}
                                    disabled={loading || selectedModules.length === 0 || confirmationPhrase !== user?.companyId?.name}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Restoring...
                                        </>
                                    ) : (
                                        'Restore Selected Data'
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setBackupFile(null)
                                        setBackupData(null)
                                        setValidated(false)
                                        setMetadata(null)
                                        setSelectedModules([])
                                        setConfirmationPhrase('')
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Restore History */}
            <Card>
                <CardHeader>
                    <CardTitle>Restore History</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRestoreHistory(!showRestoreHistory)}
                        className="ml-auto"
                    >
                        {showRestoreHistory ? 'Hide' : 'Show'}
                    </Button>
                </CardHeader>
                {showRestoreHistory && (
                    <CardContent>
                        {restores.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No restore operations found
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {restores.map(restore => (
                                    <div key={restore._id} className="p-3 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium capitalize">{restore.restoreType} Restore</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(restore.restoredAt).toLocaleString()} •
                                                    By {restore.restoredBy?.fullName || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Modules: {restore.modulesRestored?.join(', ')}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${restore.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {restore.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    )
}


export default DataManagementTab

