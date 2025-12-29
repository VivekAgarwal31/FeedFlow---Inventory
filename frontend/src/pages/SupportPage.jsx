import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { HelpCircle, BookOpen, Key, Package, DollarSign, Mail } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const SupportPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Support & Help - Stockwise Documentation</title>
                <meta name="description" content="Get help with Stockwise inventory and accounting software. Find guides, tutorials, and answers to common questions about using our platform." />
                <link rel="canonical" href="https://bhagro.site/support" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img src="/stockwise black.webp" alt="Stockwise Logo" width="150" height="40" className="h-10 w-auto" />
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/auth">
                                <Button size="sm">Get Started Free</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Support & Help
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Find answers to common questions and learn how to make the most of Stockwise for your business.
                        </p>
                    </div>

                    {/* Getting Started */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <BookOpen className="h-8 w-8 text-primary mr-3" />
                            <h2 className="text-3xl font-semibold">Getting Started</h2>
                        </div>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Creating Your Account</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        To get started with Stockwise, visit the <Link to="/auth" className="text-primary hover:underline">sign up page</Link> and create a free account. You'll need to provide:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li>Your full name</li>
                                        <li>Email address (for account verification)</li>
                                        <li>A secure password (minimum 6 characters)</li>
                                        <li>Phone number (optional)</li>
                                    </ul>
                                    <p className="text-muted-foreground mt-3">
                                        After signing up, you'll receive a verification email. Click the link to verify your account and proceed to company setup.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Setting Up Your Company</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Once your account is verified, you'll be guided through company setup:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li>Enter your company name and details</li>
                                        <li>Create your first warehouse location</li>
                                        <li>Set up your business preferences</li>
                                    </ul>
                                    <p className="text-muted-foreground mt-3">
                                        This information helps customize Stockwise for your specific business needs.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Adding Your First Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Navigate to the Stock section from your dashboard to add inventory items:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li>Click "Add Item" to create new inventory items</li>
                                        <li>Enter item details (name, category, unit)</li>
                                        <li>Use "Stock In" to record initial inventory quantities</li>
                                        <li>Assign items to specific warehouse locations</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Account & Access */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <Key className="h-8 w-8 text-primary mr-3" />
                            <h2 className="text-3xl font-semibold">Account & Access</h2>
                        </div>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Login Issues</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        If you're having trouble logging in:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li>Ensure you're using the correct email address</li>
                                        <li>Check that your password is entered correctly (passwords are case-sensitive)</li>
                                        <li>Try the "Login with Email Code" option for passwordless access</li>
                                        <li>Clear your browser cache and cookies</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Password Reset</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Forgot your password? Use the "Login with Email Code" option on the login page. You'll receive a verification code via email that you can use to access your account. Once logged in, you can set a new password in your profile settings.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Profile Updates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        To update your profile information, navigate to Settings from the dashboard. Here you can modify your name, email, phone number, and password. Changes are saved automatically.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Inventory & Accounting */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <Package className="h-8 w-8 text-primary mr-3" />
                            <h2 className="text-3xl font-semibold">Inventory & Accounting Basics</h2>
                        </div>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Stock Updates</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Stockwise provides several ways to update inventory:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li><strong>Stock In:</strong> Record incoming inventory from suppliers</li>
                                        <li><strong>Stock Out:</strong> Record outgoing inventory to customers</li>
                                        <li><strong>Stock Adjust:</strong> Correct inventory quantities for damaged or lost items</li>
                                        <li><strong>Stock Move:</strong> Transfer items between warehouse locations</li>
                                    </ul>
                                    <p className="text-muted-foreground mt-3">
                                        All stock movements are automatically recorded in your accounting ledger.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Sales & Purchase Flow</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Creating sales and purchases in Stockwise:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li>Navigate to Sales or Purchases from the dashboard</li>
                                        <li>Click "New Sale" or "New Purchase"</li>
                                        <li>Select client/supplier and add items</li>
                                        <li>Inventory and accounting entries update automatically</li>
                                        <li>Track payments in Accounts Receivable/Payable</li>
                                    </ul>
                                    <p className="text-muted-foreground mt-3">
                                        Learn more about our <Link to="/features/inventory-management" className="text-primary hover:underline">inventory features</Link> and <Link to="/features/accounting-software" className="text-primary hover:underline">accounting capabilities</Link>.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Reports & Analytics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Access comprehensive reports from the Reports section. Generate sales reports, purchase reports, inventory summaries, and financial statements. All reports can be exported to PDF or Excel for sharing with stakeholders.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Billing & Plans */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <DollarSign className="h-8 w-8 text-primary mr-3" />
                            <h2 className="text-3xl font-semibold">Billing & Plans</h2>
                        </div>
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Free vs Paid Plans</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Stockwise offers three pricing tiers:
                                    </p>
                                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                                        <li><strong>Starter (Free):</strong> Basic features for small businesses</li>
                                        <li><strong>Professional:</strong> Unlimited items and advanced features</li>
                                        <li><strong>Enterprise:</strong> Multi-company support and priority assistance</li>
                                    </ul>
                                    <p className="text-muted-foreground mt-3">
                                        View detailed plan comparison on our <Link to="/pricing" className="text-primary hover:underline">pricing page</Link>.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Upgrading Your Plan</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        You can upgrade your plan at any time from the Settings page. Upgrades take effect immediately, and you'll be charged a prorated amount for the remainder of your billing cycle. See our <Link to="/refund-policy" className="text-primary hover:underline">refund policy</Link> for cancellation terms.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
                        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Can't find what you're looking for? Our support team is here to assist you.
                        </p>
                        <Link to="/contact">
                            <Button size="lg">
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Support
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

export default SupportPage
