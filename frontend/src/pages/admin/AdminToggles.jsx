import React, { useState, useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Switch } from '../../components/ui/switch'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { adminAPI } from '../../lib/adminApi'
import { useToast } from '../../hooks/use-toast'

const AdminToggles = () => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        googleLoginEnabled: false,
        googleOneTapEnabled: false
    })
    const { toast } = useToast()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getSystemSettings()
            setSettings(response.data.settings)
        } catch (error) {
            console.error('Failed to fetch settings:', error)
            toast({
                title: 'Error',
                description: 'Failed to load system settings',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            await adminAPI.updateSystemSettings(settings)
            toast({
                title: 'Success',
                description: 'System settings updated successfully'
            })
        } catch (error) {
            console.error('Failed to update settings:', error)
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update settings',
                variant: 'destructive'
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-2">Manage global system features and authentication</p>
            </div>

            <div className="max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Google Authentication
                        </CardTitle>
                        <CardDescription>
                            Control Google Sign-In availability for all users across the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="googleLogin" className="text-base font-medium">
                                        Enable Google Sign-In
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        Allow users to sign in with their Google account. When disabled, the Google Sign-In button will be hidden from login and signup pages.
                                    </p>
                                </div>
                                <Switch
                                    id="googleLogin"
                                    checked={settings.googleLoginEnabled}
                                    onCheckedChange={(checked) => handleToggle('googleLoginEnabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label
                                        htmlFor="googleOneTap"
                                        className={`text-base font-medium ${!settings.googleLoginEnabled ? 'text-gray-400' : ''}`}
                                    >
                                        Enable Google One Tap
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        Show Google One Tap prompt for faster sign-in. Requires Google Sign-In to be enabled.
                                    </p>
                                </div>
                                <Switch
                                    id="googleOneTap"
                                    checked={settings.googleOneTapEnabled}
                                    disabled={!settings.googleLoginEnabled}
                                    onCheckedChange={(checked) => handleToggle('googleOneTapEnabled', checked)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default AdminToggles
