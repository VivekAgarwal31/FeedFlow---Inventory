import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

const RefundPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Refund & Cancellation Policy - Stockwise</title>
                <meta name="description" content="Refund and Cancellation Policy for Stockwise subscriptions. Learn about our refund terms, cancellation process, and billing policies." />
                <link rel="canonical" href="https://bhagro.site/refund-policy" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img
                                src="/stockwise black.webp"
                                alt="Stockwise Logo"
                                className="h-10 w-auto"
                            />
                        </Link>
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                    <h1 className="text-4xl font-bold mb-4">Refund & Cancellation Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: December 29, 2025</p>

                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Overview</h2>
                            <p className="text-foreground leading-relaxed">
                                This Refund and Cancellation Policy outlines the terms and conditions for subscription cancellations and refund requests for Stockwise services. We strive to provide a fair and transparent policy while maintaining the sustainability of our platform.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Free Plan</h2>
                            <p className="text-foreground leading-relaxed">
                                Our free plan does not require payment information and can be used indefinitely within the plan's limitations. You may discontinue use of the free plan at any time without any cancellation process.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                If you delete your account, all your data will be permanently removed after a grace period, as outlined in our Privacy Policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Paid Subscriptions</h2>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Subscription Billing</h3>
                            <p className="text-foreground leading-relaxed">
                                Paid subscriptions are billed in advance on a monthly or annual basis, depending on your selected plan. Subscription fees are charged automatically at the beginning of each billing cycle.
                            </p>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Cancellation Process</h3>
                            <p className="text-foreground leading-relaxed">
                                You may cancel your paid subscription at any time through your account settings or by contacting our support team at <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a>.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                When you cancel your subscription:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Your subscription will remain active until the end of your current billing period</li>
                                <li>You will continue to have access to paid features until the subscription expires</li>
                                <li>No further charges will be made after the current billing period ends</li>
                                <li>Your account will automatically downgrade to the free plan (if available) or be deactivated</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Refund Policy</h2>

                            <h3 className="text-xl font-semibold mt-6 mb-3">General Refund Terms</h3>
                            <p className="text-foreground leading-relaxed">
                                Subscription fees are generally non-refundable. However, we may consider refund requests on a case-by-case basis under the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li><strong>Service Unavailability:</strong> If our service experiences extended downtime or technical issues that prevent you from using the platform</li>
                                <li><strong>Billing Errors:</strong> If you were charged incorrectly due to a system error</li>
                                <li><strong>Duplicate Charges:</strong> If you were charged multiple times for the same subscription period</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Refund Request Process</h3>
                            <p className="text-foreground leading-relaxed">
                                To request a refund, please contact us at <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a> within 7 days of the charge. Your request should include:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Your account email address</li>
                                <li>Transaction details (date, amount)</li>
                                <li>Reason for the refund request</li>
                                <li>Any supporting documentation</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                We will review your request and respond within 5-7 business days. If approved, refunds will be processed to the original payment method within 10-14 business days.
                            </p>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Non-Refundable Situations</h3>
                            <p className="text-foreground leading-relaxed">
                                Refunds will not be provided in the following situations:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Change of mind after purchasing a subscription</li>
                                <li>Failure to cancel before the next billing cycle</li>
                                <li>Unused portion of a subscription period (partial refunds)</li>
                                <li>Account termination due to violation of our Terms & Conditions</li>
                                <li>Requests made more than 7 days after the charge</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Free Trial Period</h2>
                            <p className="text-foreground leading-relaxed">
                                If we offer a free trial for paid plans:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>You can cancel at any time during the trial period without being charged</li>
                                <li>If you do not cancel before the trial ends, you will be automatically charged for the subscription</li>
                                <li>Trial periods are for new users only and limited to one per user/company</li>
                                <li>We will send reminder emails before the trial period ends</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Plan Upgrades and Downgrades</h2>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Upgrades</h3>
                            <p className="text-foreground leading-relaxed">
                                When you upgrade to a higher-tier plan:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>The upgrade takes effect immediately</li>
                                <li>You will be charged a prorated amount for the remainder of your current billing cycle</li>
                                <li>Your next billing date remains the same</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Downgrades</h3>
                            <p className="text-foreground leading-relaxed">
                                When you downgrade to a lower-tier plan:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>The downgrade takes effect at the end of your current billing period</li>
                                <li>You will continue to have access to your current plan features until then</li>
                                <li>No refunds or credits are provided for the unused portion of the higher-tier plan</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Payment Failures</h2>
                            <p className="text-foreground leading-relaxed">
                                If a subscription payment fails:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>We will attempt to process the payment multiple times over several days</li>
                                <li>You will receive email notifications about the failed payment</li>
                                <li>If payment continues to fail, your subscription may be suspended or cancelled</li>
                                <li>You are responsible for updating your payment information to avoid service interruption</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Billing Disputes</h2>
                            <p className="text-foreground leading-relaxed">
                                If you believe you have been incorrectly charged or have questions about your billing:
                            </p>
                            <ol className="list-decimal pl-6 space-y-2 text-foreground">
                                <li>Contact us immediately at <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a></li>
                                <li>Provide your account details and transaction information</li>
                                <li>Explain the nature of the dispute</li>
                                <li>We will investigate and respond within 5-7 business days</li>
                            </ol>
                            <p className="text-foreground leading-relaxed mt-4">
                                We are committed to resolving billing issues fairly and promptly.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention After Cancellation</h2>
                            <p className="text-foreground leading-relaxed">
                                After you cancel your subscription:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Your data will be retained for 30 days to allow for reactivation</li>
                                <li>You can export your data during this period</li>
                                <li>After 30 days, your data may be permanently deleted</li>
                                <li>We may retain certain information as required by law or for legitimate business purposes</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
                            <p className="text-foreground leading-relaxed">
                                We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be posted on this page with an updated "Last updated" date. Material changes will be communicated to active subscribers via email.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                Your continued use of Stockwise after policy changes constitutes acceptance of the updated policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
                            <p className="text-foreground leading-relaxed">
                                If you have any questions about this Refund and Cancellation Policy or need assistance with your subscription, please contact us:
                            </p>
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="text-foreground"><strong>Email:</strong> <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a></p>
                                <p className="text-foreground mt-2"><strong>Service:</strong> Stockwise - Smart Inventory & Accounting Management</p>
                                <p className="text-foreground mt-2"><strong>Response Time:</strong> We typically respond within 24-48 hours during business days</p>
                            </div>
                        </div>
                    </section>
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-border bg-muted/50 py-8 mt-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Stockwise. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default RefundPolicy
