import React, { useState } from 'react'
import { Building2, Users, Upload, Wheat, Loader2 } from 'lucide-react'
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
  const { updateUser } = useAuth()
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

  const handleImportCompany = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError('')

    // Placeholder for import functionality
    setError('Import functionality will be implemented with edge functions')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-14 w-14 bg-primary rounded-full flex items-center justify-center">
              <Wheat className="h-7 w-7 text-primary-foreground" />
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
                <div className="text-sm text-muted-foreground">
                  <p>Import your company data from a previously exported backup file.</p>
                </div>

                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Warning:</strong> If you already have a company, it will be completely replaced with the imported data.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="import-file">Select Backup File</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                      onClick={() => document.getElementById('import-file').click()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Select File to Import
                        </>
                      )}
                    </Button>
                    <input
                      id="import-file"
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={handleImportCompany}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompanySetupPage
