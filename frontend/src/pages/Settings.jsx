import React, { useState, useEffect } from 'react'
import { User, Building2, Shield, Bell, Trash2, Save, Loader2, AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, companyAPI } from '../lib/api'
import { clearCompanyData, clearGlobalBusinessData } from '../lib/storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'

const Settings = () => {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteCompanyDialogOpen, setDeleteCompanyDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingCompany, setDeletingCompany] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.fullName || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      if (user.companyId) {
        setCompanyForm({
          name: user.companyId.name || '',
          address: user.companyId.address || '',
          phone: user.companyId.contactNumber || '',
          email: user.companyId.email || ''
        })
      }
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate password change if attempted
      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          setError('Current password is required to change password')
          return
        }
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          setError('New passwords do not match')
          return
        }
        if (profileForm.newPassword.length < 6) {
          setError('New password must be at least 6 characters')
          return
        }
      }

      const updateData = {
        name: profileForm.name,
        email: profileForm.email
      }

      if (profileForm.newPassword) {
        updateData.currentPassword = profileForm.currentPassword
        updateData.newPassword = profileForm.newPassword
      }

      await authAPI.updateProfile(updateData)

      // Update local user data
      const updatedUser = { ...user, fullName: profileForm.name, email: profileForm.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Profile updated successfully')

      // Clear password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await companyAPI.update(companyForm)

      // Update local user data
      const updatedUser = {
        ...user,
        companyId: {
          ...user.companyId,
          name: companyForm.name,
          address: companyForm.address,
          contactNumber: companyForm.phone,
          email: companyForm.email
        }
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSuccess('Company information updated successfully')
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update company information')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (deleteConfirmation !== user.companyId?.name) {
      setError('Company name does not match')
      return
    }

    setDeletingCompany(true)
    setError('')

    try {
      await companyAPI.delete()

      // Clear all company-specific localStorage data using utility function
      clearCompanyData()

      // Clear any global business data to prevent contamination
      clearGlobalBusinessData()

      // Clear user session data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lastCompanyId')

      // Redirect to auth page
      window.location.href = '/auth'
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete company')
      setDeletingCompany(false)
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, company, and system preferences
        </p>
      </div>

      {/* Global Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, name: e.target.value })
                        clearMessages()
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => {
                        setProfileForm({ ...profileForm, email: e.target.value })
                        clearMessages()
                      }}
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Leave password fields empty if you don't want to change your password
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={profileForm.currentPassword}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, currentPassword: e.target.value })
                          clearMessages()
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={profileForm.newPassword}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, newPassword: e.target.value })
                          clearMessages()
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={profileForm.confirmPassword}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, confirmPassword: e.target.value })
                          clearMessages()
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Manage your company details and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanyUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyForm.name}
                        onChange={(e) => {
                          setCompanyForm({ ...companyForm, name: e.target.value })
                          clearMessages()
                        }}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyForm.email}
                        onChange={(e) => {
                          setCompanyForm({ ...companyForm, email: e.target.value })
                          clearMessages()
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">Address</Label>
                    <Input
                      id="companyAddress"
                      type="text"
                      value={companyForm.address}
                      onChange={(e) => {
                        setCompanyForm({ ...companyForm, address: e.target.value })
                        clearMessages()
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Phone Number</Label>
                    <Input
                      id="companyPhone"
                      type="tel"
                      value={companyForm.phone}
                      onChange={(e) => {
                        setCompanyForm({ ...companyForm, phone: e.target.value })
                        clearMessages()
                      }}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Update Company
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Company Information Display */}
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Company Code:</span>
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {user?.companyId?.companyCode || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">
                    {user?.companyId?.createdAt ? new Date(user.companyId.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Your Role:</span>
                  <span className="text-sm capitalize">
                    {user?.role || 'Member'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            {user?.role === 'owner' && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <h4 className="font-medium text-destructive">Delete Company</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this company and all its data. This action cannot be undone.
                      </p>
                    </div>
                    <Dialog open={deleteCompanyDialogOpen} onOpenChange={setDeleteCompanyDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" onClick={clearMessages}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Company
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-destructive">Delete Company</DialogTitle>
                          <DialogDescription>
                            This will permanently delete your company and all associated data including:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>All stock items and inventory</li>
                              <li>Sales and purchase records</li>
                              <li>Client and supplier information</li>
                              <li>All user accounts in this company</li>
                              <li>Warehouse and transaction data</li>
                            </ul>
                            <br />
                            <strong>This action cannot be undone.</strong> All data will be permanently deleted immediately.
                          </DialogDescription>
                        </DialogHeader>

                        {error && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="deleteConfirmation">
                              Type <strong>{user?.companyId?.name}</strong> to confirm deletion:
                            </Label>
                            <Input
                              id="deleteConfirmation"
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => {
                                setDeleteConfirmation(e.target.value)
                                setError('')
                              }}
                              placeholder={user?.companyId?.name}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteCompany}
                              disabled={deletingCompany || deleteConfirmation !== user?.companyId?.name}
                              className="flex-1"
                            >
                              {deletingCompany ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting Company...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Company Forever
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setDeleteCompanyDialogOpen(false)
                                setDeleteConfirmation('')
                                setError('')
                              }}
                              disabled={deletingCompany}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and login sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Login Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Logout from all devices</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign out from all devices and browsers
                      </p>
                    </div>
                    <Button variant="outline" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout Everywhere
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Low Stock Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified when stock levels are running low
                        </p>
                      </div>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Sales Reports</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive daily/weekly sales summary reports
                        </p>
                      </div>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">System Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about system maintenance and updates
                        </p>
                      </div>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Settings
