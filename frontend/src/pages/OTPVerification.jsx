import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../hooks/use-toast'
import { authAPI } from '../lib/api'

const OTPVerification = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { toast } = useToast()

    const email = location.state?.email || ''
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
    const inputRefs = useRef([])

    // Redirect if no email
    useEffect(() => {
        if (!email) {
            navigate('/auth')
        }
    }, [email, navigate])

    // Countdown timer
    useEffect(() => {
        if (timeLeft <= 0) return

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft])

    // Format time as MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Handle OTP input change
    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return // Only allow digits

        const newOtp = [...otp]
        newOtp[index] = value.slice(-1) // Only take last character
        setOtp(newOtp)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').slice(0, 6)
        if (!/^\d+$/.test(pastedData)) return

        const newOtp = [...otp]
        pastedData.split('').forEach((char, index) => {
            if (index < 6) newOtp[index] = char
        })
        setOtp(newOtp)

        // Focus last filled input or next empty
        const nextIndex = Math.min(pastedData.length, 5)
        inputRefs.current[nextIndex]?.focus()
    }

    // Verify OTP
    const handleVerify = async () => {
        const otpCode = otp.join('')

        if (otpCode.length !== 6) {
            toast({
                title: 'Invalid Code',
                description: 'Please enter all 6 digits',
                variant: 'destructive'
            })
            return
        }

        setLoading(true)
        try {
            const response = await authAPI.verifyOTP({ email, otp: otpCode })

            // Store token and user data
            localStorage.setItem('token', response.data.token)
            localStorage.setItem('user', JSON.stringify(response.data.user))

            toast({
                title: 'Success!',
                description: 'Login successful'
            })

            // Force reload to update AuthContext
            // This ensures the app picks up the new token and user from localStorage
            window.location.href = response.data.user.role === 'super_admin'
                ? '/admin'
                : response.data.user.companyId
                    ? '/dashboard'
                    : '/company-setup'
        } catch (error) {
            toast({
                title: 'Verification Failed',
                description: error.response?.data?.message || 'Invalid or expired code',
                variant: 'destructive'
            })
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    // Resend OTP
    const handleResend = async () => {
        setResending(true)
        try {
            await authAPI.requestOTP({ email })
            setTimeLeft(600) // Reset timer
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()

            toast({
                title: 'Code Sent',
                description: 'A new verification code has been sent to your email'
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to resend code',
                variant: 'destructive'
            })
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
                    <CardDescription className="text-base">
                        We've sent a 6-digit code to<br />
                        <span className="font-semibold text-foreground">{email}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* OTP Input */}
                    <div className="space-y-4">
                        <div className="flex gap-2 justify-center">
                            {otp.map((digit, index) => (
                                <Input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 text-center text-2xl font-bold"
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        {/* Timer */}
                        <div className="text-center">
                            {timeLeft > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Code expires in <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
                                </p>
                            ) : (
                                <p className="text-sm text-destructive font-semibold">
                                    Code expired. Please request a new one.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Verify Button */}
                    <Button
                        onClick={handleVerify}
                        disabled={loading || otp.join('').length !== 6 || timeLeft <= 0}
                        className="w-full h-11"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify Code'
                        )}
                    </Button>

                    {/* Resend Code */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Didn't receive the code?
                        </p>
                        <Button
                            variant="ghost"
                            onClick={handleResend}
                            disabled={resending || timeLeft > 540} // Can resend after 1 minute
                            className="text-sm"
                        >
                            {resending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Code
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Back to Login */}
                    <Button
                        variant="outline"
                        onClick={() => navigate('/auth')}
                        className="w-full"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default OTPVerification
