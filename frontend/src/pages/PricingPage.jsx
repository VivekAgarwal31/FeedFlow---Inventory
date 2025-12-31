import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { pricingPlans } from '../lib/pricingPlans'

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Pricing - Simple and Transparent Plans | Stockwise</title>
                <meta name="description" content="Transparent pricing for Stockwise inventory and accounting software. Start free, upgrade as you grow. No hidden costs, cancel anytime." />
                <meta name="keywords" content="inventory software pricing, accounting software cost, business management pricing, SaaS pricing plans" />
                <link rel="canonical" href="https://bhagro.site/pricing" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img src="/stockwise black.webp" alt="Stockwise Logo" width="150" height="40" className="h-10 w-auto" />
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/features" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Features
                            </Link>
                            <Link to="/blog" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Blog
                            </Link>
                            <Link to="/auth">
                                <Button size="sm">Get Started Free</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Simple and Transparent Pricing
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            No hidden costs, no surprises. Choose the plan that fits your business and scale as you grow. All plans include core inventory and accounting features.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <section className="mb-16">
                        <div className="grid md:grid-cols-3 gap-8">
                            {pricingPlans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
                                >
                                    {plan.highlighted && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                        </div>
                                    )}
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">{plan.priceLabel}</span>
                                        </div>
                                        <CardDescription className="mt-2">{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link to="/auth" className="block">
                                            <Button
                                                variant={plan.ctaVariant}
                                                className="w-full"
                                            >
                                                {plan.ctaText}
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Which Plan */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-semibold mb-8 text-center">Which Plan Is Right for You?</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle>Free Plan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Perfect for small businesses just getting started with basic inventory needs.
                                    </p>
                                    <p className="text-sm font-medium">Best for:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                                        <li>• New businesses</li>
                                        <li>• Testing the platform</li>
                                        <li>• Very small inventory (up to 5 items)</li>
                                        <li>• Single or dual warehouse setup</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary">
                                <CardHeader>
                                    <CardTitle>14-Day Trial</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Try all premium features risk-free for 14 days. No credit card required.
                                    </p>
                                    <p className="text-sm font-medium">Best for:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                                        <li>• Evaluating full platform capabilities</li>
                                        <li>• Testing advanced features</li>
                                        <li>• Migrating from another system</li>
                                        <li>• All new signups (automatic)</li>
                                    </ul>
                                    <p className="text-xs text-muted-foreground mt-4 italic">
                                        * Automatically downgrades to Free plan after 14 days
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle>Professional Plan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Ideal for growing businesses that need unlimited inventory, advanced features, and comprehensive reporting.
                                    </p>
                                    <p className="text-sm font-medium">Best for:</p>
                                    <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                                        <li>• Growing businesses</li>
                                        <li>• Multiple warehouses</li>
                                        <li>• Large inventory</li>
                                        <li>• Advanced reporting needs</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="max-w-3xl mx-auto space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        Is there a free plan?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes! Our Starter plan is completely free and includes essential inventory and accounting features. It's perfect for small businesses or those wanting to try Stockwise before committing to a paid plan.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        Can I upgrade or downgrade later?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Absolutely! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect at the start of your next billing cycle, and we'll prorate any charges accordingly.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        Is my data secure?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes. We use industry-standard encryption for data in transit and at rest. Your data is backed up regularly and stored in secure cloud infrastructure. We never share your business data with third parties.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        What payment methods do you accept?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        We accept all major credit and debit cards. Payment processing is handled securely through trusted payment gateways. For Enterprise plans, we can arrange custom payment terms.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        Can I cancel anytime?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period. See our <Link to="/refund-policy" className="text-primary hover:underline">refund policy</Link> for more details.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-lg">
                                        <HelpCircle className="h-5 w-5 text-primary mr-2" />
                                        Do you offer support?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes! All plans include email support. Professional and Enterprise plans receive priority support with faster response times. Visit our <Link to="/support" className="text-primary hover:underline">support page</Link> for help resources.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Start with our free plan today. No credit card required. Upgrade anytime as your business grows.
                        </p>
                        <Link to="/auth">
                            <Button size="lg">
                                Start Free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
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

export default PricingPage
