import React, { useState } from 'react'
import { Building2, Users, Upload, Package, Loader2, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { companyAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Alert, AlertDescription } from '../components/ui/alert'

const CompanySetupPage = () => {
  const { updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'all',
    address: '',
    contactNumber: '',
    gstNumber: ''
  })

  const [joinForm, setJoinForm] = useState({
    companyCode: ''
  })

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await companyAPI.create(createForm)
      const company = response.data.company

      // Update user context with company
      updateUser(prev => ({ ...prev, companyId: company }))

      window.location.href = '/dashboard'
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create company')
    }

    setLoading(false)
  }

  const handleJoinCompany = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await companyAPI.join(joinForm.companyCode.toUpperCase())
      const company = response.data.company

      // Update user context with company
      updateUser(prev => ({ ...prev, companyId: company }))

      window.location.href = '/dashboard'
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join company')
    }

    setLoading(false)
  }

  // Import state
  const [backupDownloaded, setBackupDownloaded] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importData, setImportData] = useState(null)
  const [importMetadata, setImportMetadata] = useState(null)
  const [importWarnings, setImportWarnings] = useState([])
  const [confirmationPhrase, setConfirmationPhrase] = useState('')

  const handleDownloadCurrentBackup = async () => {
    setLoading(true)
    setError('')

    try {
      const { dataManagementAPI } = await import('../lib/api')
      const response = await dataManagementAPI.createBackup()

      // Download the backup file
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)],
        { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.data.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setBackupDownloaded(true)
      setError('Backup downloaded successfully. You can now upload a backup file to import.')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to download backup')
    }

    setLoading(false)
  }

  const handleImportFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError('')
    setImportFile(file)
    setImportData(null)
    setImportMetadata(null)
    setImportWarnings([])
    setConfirmationPhrase('')

    // Read and parse file
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result)
        setImportData(data)

        // Validate
        const { dataManagementAPI } = await import('../lib/api')
        const response = await dataManagementAPI.validateBackup(file)
        setImportMetadata(response.data.metadata)
        setImportWarnings(response.data.warnings || [])

        setError('') // Clear any previous errors
      } catch (error) {
        setError(error.response?.data?.message || 'Invalid backup file. Please select a valid JSON backup.')
        setImportFile(null)
        setImportData(null)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleImportCompany = async () => {
    if (!importData || !importMetadata) {
      setError('Please select a valid backup file first')
      return
    }

    if (confirmationPhrase !== importMetadata.companyName) {
      setError('Incorrect confirmation phrase. Please type the company name exactly.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { dataManagementAPI } = await import('../lib/api')
      await dataManagementAPI.restoreFull(importData, confirmationPhrase)

      // Success - redirect to dashboard
      alert('Company data imported successfully! The page will now reload.')
      window.location.href = '/dashboard'
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to import company data')
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    logout()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1" />
            <div className="flex justify-center flex-1">
              <div className="h-14 w-14 bg-primary rounded-full flex items-center justify-center">
                <Package className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Company Setup</CardTitle>
            <CardDescription className="mt-1">
              Create a new company, join an existing one, or import your data
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Create Company
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Join Company
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Company
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="create" className="space-y-4 mt-4">
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name *</Label>
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="ABC Feed Industries"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-type">Business Type</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="all">All Types</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Industrial Area, City"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={createForm.contactNumber}
                      onChange={(e) => setCreateForm({ ...createForm, contactNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    value={createForm.gstNumber}
                    onChange={(e) => setCreateForm({ ...createForm, gstNumber: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Company'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="space-y-4 mt-4">
              <form onSubmit={handleJoinCompany} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-code">Company Code</Label>
                  <Input
                    id="company-code"
                    type="text"
                    placeholder="CFX-12345"
                    className="font-mono uppercase"
                    value={joinForm.companyCode}
                    onChange={(e) => setJoinForm({ ...joinForm, companyCode: e.target.value.toUpperCase() })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the company code provided by your administrator
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Company'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>WARNING:</strong> This will DELETE all current company data and replace it with the backup.
                    This action CANNOT be undone!
                  </AlertDescription>
                </Alert>

                {/* Step 1: Download Current Backup */}
                {!backupDownloaded && (
                  <div className="space-y-2">
                    <Label>Step 1: Download Current Backup (Required)</Label>
                    <p className="text-sm text-muted-foreground">
                      Before importing, you must download a backup of your current data as a safety measure.
                    </p>
                    <Button
                      type="button"
                      onClick={handleDownloadCurrentBackup}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading Backup...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Download Current Backup First
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Step 2: Upload Backup File */}
                {backupDownloaded && !importFile && (
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Step 2: Upload Backup File</Label>
                    <p className="text-sm text-muted-foreground">
                      Select the JSON backup file you want to import.
                    </p>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleImportFileSelect}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Step 3: Validate & Confirm */}
                {importFile && loading && !importMetadata && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Validating backup file...</AlertDescription>
                  </Alert>
                )}

                {importMetadata && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        <p className="font-medium">Backup Information:</p>
                        <p className="text-sm">Company: {importMetadata.companyName}</p>
                        <p className="text-sm">Created: {new Date(importMetadata.createdAt).toLocaleString()}</p>
                        <p className="text-sm">
                          Records: {importMetadata.recordCounts?.stockItems || 0} items,
                          {importMetadata.recordCounts?.sales || 0} sales,
                          {importMetadata.recordCounts?.clients || 0} clients
                        </p>
                        {importWarnings.length > 0 && (
                          <div className="mt-2">
                            {importWarnings.map((warning, idx) => (
                              <p key={idx} className="text-xs text-yellow-600">⚠️ {warning}</p>
                            ))}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-phrase">Type company name to confirm</Label>
                      <Input
                        id="confirm-phrase"
                        type="text"
                        placeholder={importMetadata.companyName}
                        value={confirmationPhrase}
                        onChange={(e) => setConfirmationPhrase(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Type "{importMetadata.companyName}" exactly to confirm
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleImportCompany}
                        disabled={loading || confirmationPhrase !== importMetadata.companyName}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          'Import Company (Replace All Data)'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImportFile(null)
                          setImportData(null)
                          setImportMetadata(null)
                          setImportWarnings([])
                          setConfirmationPhrase('')
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompanySetupPage
