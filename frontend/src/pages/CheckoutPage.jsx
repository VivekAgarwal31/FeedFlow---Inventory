import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { paymentAPI, subscriptionAPI } from '../lib/api';
import { loadRazorpayScript, openRazorpayCheckout } from '../lib/razorpay';
import PlanBadge from '../components/PlanBadge';
import { formatCurrency } from '../lib/utils';

const CheckoutPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);

    const planType = searchParams.get('plan') || 'paid';
    const planPrice = 2499; // ₹2,499 for paid plan

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [discount, setDiscount] = useState(0);
    const [finalAmount, setFinalAmount] = useState(planPrice);
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    useEffect(() => {
        checkEligibility();
    }, []);

    const checkEligibility = async () => {
        try {
            setLoading(true);
            const response = await subscriptionAPI.getStatus();
            const currentSubscription = response.data;

            setSubscription(currentSubscription);

            // Check if already on paid plan
            if (currentSubscription.planType === 'paid') {
                toast({
                    title: 'Already Subscribed',
                    description: 'You already have an active paid plan',
                });
                navigate('/dashboard');
                return;
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to check eligibility:', error);
            setError('Failed to load checkout. Please try again.');
            setLoading(false);
        }
    };

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            toast({
                title: 'Invalid Input',
                description: 'Please enter a coupon code',
                variant: 'destructive'
            });
            return;
        }

        try {
            setApplyingCoupon(true);
            setError(null);

            const response = await paymentAPI.validateCoupon({
                code: couponCode,
                planType
            });

            if (response.data.valid) {
                setCouponApplied(true);
                setCouponData(response.data.coupon);
                setDiscount(response.data.discountAmount);
                setFinalAmount(response.data.finalAmount);

                toast({
                    title: 'Coupon Applied!',
                    description: `You saved ₹${response.data.discountAmount}`,
                });
            }
        } catch (error) {
            toast({
                title: 'Invalid Coupon',
                description: error.response?.data?.message || 'This coupon code is not valid',
                variant: 'destructive'
            });
        } finally {
            setApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setCouponCode('');
        setCouponApplied(false);
        setCouponData(null);
        setDiscount(0);
        setFinalAmount(planPrice);
    };

    const handlePayment = async () => {
        try {
            setProcessing(true);
            setError(null);

            // If final amount is 0 (free plan), activate directly
            if (finalAmount === 0 && couponApplied) {
                const response = await paymentAPI.activateFreePlan({
                    planType,
                    couponCode
                });

                if (response.data.success) {
                    toast({
                        title: response.data.message,
                        description: 'Your plan has been activated successfully',
                    });
                    navigate('/dashboard');
                }
                return;
            }

            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load payment gateway. Please try again.');
            }

            // Create order with final amount (after discount)
            const orderResponse = await paymentAPI.createOrder(planType);
            const { orderId, amount, currency, keyId } = orderResponse.data;

            // Use discounted amount if coupon applied
            const payableAmount = couponApplied ? finalAmount * 100 : amount;

            // Open Razorpay checkout
            openRazorpayCheckout({
                keyId,
                orderId,
                amount: payableAmount,
                currency,
                name: 'Stockwise',
                description: 'Paid Plan Subscription',
                onSuccess: async (paymentData) => {
                    try {
                        // Verify payment on backend
                        const verifyResponse = await paymentAPI.verifyPayment(paymentData);

                        if (verifyResponse.data.success) {
                            toast({
                                title: 'Payment Successful!',
                                description: 'Your plan has been upgraded successfully',
                            });
                            navigate('/dashboard');
                        }
                    } catch (verifyError) {
                        console.error('Payment verification failed:', verifyError);
                        setError('Payment verification failed. Please contact support.');
                        setProcessing(false);
                    }
                },
                onFailure: (failureError) => {
                    console.error('Payment failed:', failureError);
                    setError(failureError.message || 'Payment failed. Please try again.');
                    setProcessing(false);
                }
            });
        } catch (error) {
            console.error('Payment error:', error);
            setError(error.response?.data?.message || error.message || 'Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Loading checkout...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Purchase</h1>
                    <p className="text-gray-600">Upgrade to unlock unlimited features</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Plan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Current Plan</CardTitle>
                            <CardDescription>Your active subscription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Plan</span>
                                    <PlanBadge
                                        planType={subscription?.planType}
                                        planName={subscription?.planName}
                                    />
                                </div>
                                {subscription?.isTrial && subscription?.daysRemaining !== undefined && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Trial Ends In</span>
                                        <Badge variant={subscription.daysRemaining <= 3 ? 'destructive' : 'secondary'}>
                                            {subscription.daysRemaining} days
                                        </Badge>
                                    </div>
                                )}
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500">
                                        {subscription?.isTrial
                                            ? 'Upgrade now to continue enjoying unlimited access after your trial ends.'
                                            : 'Upgrade to unlock all premium features and remove limitations.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* New Plan */}
                    <Card className="border-2 border-blue-500">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Paid Plan
                                <Badge className="bg-blue-500">Recommended</Badge>
                            </CardTitle>
                            <CardDescription>Full access to all features</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="text-center py-4">
                                    <div className="text-4xl font-bold text-gray-900">
                                        {formatCurrency(planPrice)}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">One-time payment</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Unlimited warehouses</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Unlimited stock items</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Advanced reports (PDF/Excel)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Full accounting module</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span>Data backup & export</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coupon Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Have a Coupon Code?</CardTitle>
                        <CardDescription>Apply a discount code to your purchase</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!couponApplied ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                                    disabled={applyingCoupon}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={applyCoupon}
                                    disabled={applyingCoupon || !couponCode.trim()}
                                    variant="outline"
                                >
                                    {applyingCoupon ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            Applying...
                                        </>
                                    ) : (
                                        'Apply'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Coupon Applied!</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        Code: <strong>{couponData?.code}</strong> - You saved ₹{discount}
                                    </AlertDescription>
                                </Alert>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={removeCoupon}
                                    className="w-full"
                                >
                                    Remove Coupon
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Billing Summary */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Billing Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Paid Plan</span>
                                <span className="font-medium">{formatCurrency(planPrice)}</span>
                            </div>
                            {couponApplied && discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount ({couponData?.code})</span>
                                    <span className="font-medium">-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium">Included</span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold">Total Amount</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(finalAmount)}
                                </span>
                            </div>
                            {finalAmount === 0 && couponApplied && (
                                <Alert className="bg-blue-50 border-blue-200">
                                    <AlertDescription className="text-blue-800 text-center">
                                        🎁 This plan is FREE with your coupon!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Button */}
                <div className="mt-6 space-y-4">
                    <Button
                        onClick={handlePayment}
                        disabled={processing}
                        className="w-full h-12 text-lg"
                        size="lg"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay {formatCurrency(planPrice)}
                            </>
                        )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Shield className="h-4 w-4" />
                        <span>Secure payment powered by Razorpay</span>
                    </div>

                    <div className="text-center">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/dashboard')}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
