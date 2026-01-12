import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Mail, ChevronLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useToast } from '../hooks/use-toast'
import { useGoogleAuth } from '../hooks/useGoogleAuth'
import { useMicrosoftAuth } from '../hooks/useMicrosoftAuth'

const AuthPage = () => {
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [error, setError] = useState('')
  const { loginWithGoogle, isLoading: googleLoading, error: googleError } = useGoogleAuth()
  const { loginWithMicrosoft, isLoading: microsoftLoading, error: microsoftError } = useMicrosoftAuth()
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)
  const [microsoftAuthEnabled, setMicrosoftAuthEnabled] = useState(false)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  })

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  // Fetch system settings to check if OAuth providers are enabled
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/system-settings`)
        const data = await res.json()
        setGoogleAuthEnabled(data.googleLoginEnabled || false)
        setMicrosoftAuthEnabled(data.microsoftLoginEnabled || false)
      } catch (err) {
        console.error('Failed to fetch system settings:', err)
      }
    }
    fetchSystemSettings()
  }, [])
  // Show OAuth errors if any
  useEffect(() => {
    if (googleError) {
      setError(googleError)
    }
    if (microsoftError) {
      setError(microsoftError)
    }
  }, [googleError, microsoftError])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(loginForm)

    if (!result.success) {
      // Check if verification is required
      if (result.requiresVerification) {
        toast({
          title: 'Email Not Verified',
          description: result.message
        })
        navigate('/verify-otp', { state: { email: result.email } })
      } else {
        setError(result.message)
      }
    }

    setLoading(false)
  }

  const handleEmailLogin = async () => {
    if (!loginForm.email) {
      setError('Please enter your email address')
      return
    }

    setOtpLoading(true)
    setError('')

    try {
      await authAPI.requestOTP({ email: loginForm.email })
      toast({
        title: 'Code Sent!',
        description: 'Check your email for the verification code'
      })
      navigate('/verify-otp', { state: { email: loginForm.email } })
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError('You must accept the Terms & Conditions and Privacy Policy')
      setLoading(false)
      return
    }

    const result = await register(signupForm)

    if (!result.success) {
      setError(result.message)
      setLoading(false)
      return
    }

    // If verification is required, redirect to OTP page
    if (result.requiresVerification) {
      toast({
        title: 'Account Created!',
        description: result.message || 'Please check your email for verification code'
      })
      navigate('/verify-otp', { state: { email: result.email } })
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center items-center relative">
            {/* Back button on the left */}
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
              className="absolute left-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>

            {/* Logo in center */}
            <img
              src="/stockwise black.webp"
              alt="Stockwise Logo"
              className="h-16 object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Stockwise</CardTitle>
            <CardDescription className="mt-1">
              Smart Inventory Management System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || otpLoading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login with Password'
                  )}
                </Button>
              </form>

              {/* OAuth Sign-In - Only show if enabled by admin */}
              {(googleAuthEnabled || microsoftAuthEnabled) && (
                <>
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* OAuth Buttons - Stack vertically for better compatibility */}
                  <div className="space-y-3">
                    {/* Google Sign-In Button */}
                    {googleAuthEnabled && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 flex items-center justify-center"
                        onClick={loginWithGoogle}
                        disabled={loading || otpLoading || googleLoading}
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                            Continue with Google
                          </>
                        )}
                      </Button>
                    )}

                    {/* Microsoft Sign-In Button */}
                    {microsoftAuthEnabled && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 flex items-center justify-center"
                        onClick={loginWithMicrosoft}
                        disabled={loading || otpLoading || microsoftLoading}
                      >
                        {microsoftLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                            </svg>
                            Continue with Microsoft
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              {/* Email Code Login */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleEmailLogin}
                disabled={loading || otpLoading}
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Login with Email Code
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (Optional)</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>

                {/* Terms Acceptance Checkbox */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="accept-terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    required
                  />
                  <label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms-and-conditions" target="_blank" className="text-primary hover:underline">
                      Terms & Conditions
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                {/* OAuth Sign-In - Only show if enabled by admin */}
                {(googleAuthEnabled || microsoftAuthEnabled) && (
                  <>
                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    {/* OAuth Buttons - Stack vertically for better compatibility */}
                    <div className="space-y-3">
                      {/* Google Sign-In Button */}
                      {googleAuthEnabled && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 flex items-center justify-center"
                          onClick={loginWithGoogle}
                          disabled={loading || googleLoading}
                        >
                          {googleLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                              </svg>
                              Continue with Google
                            </>
                          )}
                        </Button>
                      )}

                      {/* Microsoft Sign-In Button */}
                      {microsoftAuthEnabled && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10 flex items-center justify-center"
                          onClick={loginWithMicrosoft}
                          disabled={loading || microsoftLoading}
                        >
                          {microsoftLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                              </svg>
                              Continue with Microsoft
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthPage
