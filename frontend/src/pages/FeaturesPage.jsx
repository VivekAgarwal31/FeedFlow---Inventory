import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Package, DollarSign, BarChart3, Users, TrendingUp, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const FeaturesPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Features - Inventory & Accounting Management | Stockwise</title>
                <meta name="description" content="Explore Stockwise features: comprehensive inventory management, integrated accounting software, sales tracking, purchase management, and financial reporting for growing businesses." />
                <meta name="keywords" content="inventory features, accounting features, stock management, business management software, inventory tracking, financial management" />
                <link rel="canonical" href="https://bhagro.site/features" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img src="/stockwise black.webp" alt="Stockwise Logo" className="h-10 w-auto" />
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
                <article className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Powerful Features for Modern Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Stockwise combines inventory management and accounting in one integrated platform. Manage your stock, track sales and purchases, and maintain accurate financial records—all from a single dashboard.
                        </p>
                    </div>

                    {/* Main Feature Categories */}
                    <section className="mb-16">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Inventory Management */}
                            <Card className="border-2 hover:border-primary transition-colors">
                                <CardHeader>
                                    <Package className="h-12 w-12 text-primary mb-4" />
                                    <CardTitle className="text-2xl">Inventory Management</CardTitle>
                                    <CardDescription className="text-base">
                                        Complete stock control with real-time tracking, multi-warehouse support, and automated updates.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Real-time stock tracking across warehouses
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Stock in/out with complete audit trails
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Low stock alerts and reorder management
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Item categorization and organization
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Stock movement between locations
                                        </li>
                                    </ul>
                                    <Link to="/features/inventory-management">
                                        <Button className="w-full mt-4">
                                            Learn More About Inventory
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Accounting Software */}
                            <Card className="border-2 hover:border-primary transition-colors">
                                <CardHeader>
                                    <DollarSign className="h-12 w-12 text-primary mb-4" />
                                    <CardTitle className="text-2xl">Accounting Software</CardTitle>
                                    <CardDescription className="text-base">
                                        Integrated accounting with automatic entries, receivables, payables, and financial reporting.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Accounts receivable and payable tracking
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Digital cashbook with transaction history
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Double-entry bookkeeping system
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Automatic accounting entries from sales
                                        </li>
                                        <li className="flex items-start">
                                            <span className="text-primary mr-2">•</span>
                                            Financial reports and statements
                                        </li>
                                    </ul>
                                    <Link to="/features/accounting-software">
                                        <Button className="w-full mt-4">
                                            Learn More About Accounting
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Additional Features Grid */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-semibold mb-8 text-center">Complete Business Management</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Sales Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Create sales orders, track deliveries, manage client relationships, and monitor sales performance with detailed reports.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <FileText className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Purchase Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Manage purchase orders, track supplier deliveries, maintain supplier records, and control procurement processes.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Users className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Client & Supplier Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Maintain comprehensive client and supplier databases with transaction history, outstanding balances, and contact details.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <BarChart3 className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Reports & Analytics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Generate comprehensive reports for sales, purchases, inventory, and finances. Export to PDF or Excel for sharing.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Package className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Multi-Warehouse Support</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Manage inventory across multiple warehouse locations with stock transfers, location-specific reporting, and centralized control.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Users className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Staff Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        Add team members, assign roles, track user activities, and maintain complete audit trails for all transactions.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Integration Highlight */}
                    <section className="mb-16">
                        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8">
                            <h2 className="text-3xl font-semibold mb-4 text-center">Seamless Integration</h2>
                            <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-6">
                                The real power of Stockwise comes from the seamless integration between inventory and accounting. When you create a sale or purchase, inventory levels and financial records update automatically—no duplicate data entry, no reconciliation headaches.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link to="/features/inventory-management">
                                    <Button variant="outline">Inventory Features</Button>
                                </Link>
                                <Link to="/features/accounting-software">
                                    <Button variant="outline">Accounting Features</Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Experience These Features?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Start with our free plan and explore all features. No credit card required.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/auth">
                                <Button size="lg">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline">
                                    View Pricing
                                </Button>
                            </Link>
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

export default FeaturesPage
