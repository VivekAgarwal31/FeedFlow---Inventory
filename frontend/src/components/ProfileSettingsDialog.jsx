import React, { useState, useEffect } from 'react'
import { User, Lock, Save, Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../lib/api'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const ProfileSettingsDialog = ({ open, onOpenChange }) => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: ''
    })

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    useEffect(() => {
        if (user) {
            setProfileForm({
                name: user.fullName || '',
                email: user.email || ''
            })
        }
    }, [user])

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const updateData = {
                name: profileForm.name,
                email: profileForm.email
            }

            const response = await authAPI.updateProfile(updateData)
            updateUser(response.data.user)
            setSuccess('Profile updated successfully')
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            // Validate password change
            if (!passwordForm.currentPassword) {
                setError('Current password is required')
                return
            }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                setError('New passwords do not match')
                return
            }
            if (passwordForm.newPassword.length < 6) {
                setError('New password must be at least 6 characters')
                return
            }

            await authAPI.updateProfile({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            })

            setSuccess('Password changed successfully')
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    const clearMessages = () => {
        setError('')
        setSuccess('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Account Settings</DialogTitle>
                    <DialogDescription>
                        Manage your personal information and security settings
                    </DialogDescription>
                </DialogHeader>

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

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="profile">
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="password">
                            <Lock className="h-4 w-4 mr-2" />
                            Password
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4 mt-4">
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
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

                            <Button type="submit" disabled={loading} className="w-full">
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
                        </form>
                    </TabsContent>

                    {/* Password Tab */}
                    <TabsContent value="password" className="space-y-4 mt-4">
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                                        clearMessages()
                                    }}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                        clearMessages()
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 6 characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => {
                                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                        clearMessages()
                                    }}
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Changing Password...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Change Password
                                    </>
                                )}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

export default ProfileSettingsDialog
