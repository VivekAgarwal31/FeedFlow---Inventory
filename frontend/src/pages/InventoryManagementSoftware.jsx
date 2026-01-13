import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Package, TrendingUp, BarChart3, CheckCircle2, Warehouse, ShoppingCart, DollarSign, Clock, Users, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const InventoryManagementSoftware = () => {
    // Structured data for SEO - SoftwareApplication
    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Stockwise Inventory Management Software",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR",
            "priceValidUntil": "2026-12-31"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "100"
        },
        "description": "Powerful inventory management software with real-time tracking, multi-warehouse support, automated reordering, and seamless accounting integration. Perfect for growing businesses.",
        "featureList": [
            "Real-time inventory tracking",
            "Multi-warehouse management",
            "Automated reorder alerts",
            "Sales and purchase order management",
            "Accounting integration",
            "Inventory reports and analytics",
            "Stock transfer management",
            "Low stock notifications"
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Management Software | Stockwise - Free Trial</title>
                <meta name="description" content="Powerful inventory management software with real-time tracking, multi-warehouse support, and accounting integration. Start free today." />
                <meta name="keywords" content="inventory management software, inventory software, stock management software, inventory system, inventory tracking software, warehouse management software" />
                <link rel="canonical" href="https://stock-wise.in/inventory-management-software/" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://stock-wise.in/inventory-management-software/" />
                <meta property="og:title" content="Inventory Management Software | Stockwise" />
                <meta property="og:description" content="Powerful inventory management software with real-time tracking, multi-warehouse support, and accounting integration." />

                {/* Structured Data - SoftwareApplication */}
                <script type="application/ld+json">
                    {JSON.stringify(softwareSchema)}
                </script>
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
                            <Link to="/pricing" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Pricing
                            </Link>
                            <Link to="/auth">
                                <Button size="sm">Start Free Trial</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Breadcrumb */}
            <div className="border-b border-border bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-foreground">Inventory Management Software</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Trusted by 100+ Businesses</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Best Inventory Management Software for Growing Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                            Stop wasting time on spreadsheets and manual stock counts. Stockwise provides real-time inventory tracking, automated reordering, multi-warehouse management, and seamless accounting integration—all in one powerful platform. Start your free trial today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    View Pricing
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* What is Inventory Management Software */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What is Inventory Management Software?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Inventory management software is a digital solution that automates the tracking, ordering, storing, and controlling of your business's inventory. Unlike manual methods or spreadsheets, modern inventory software provides real-time visibility into stock levels, automates reordering, prevents stockouts, and integrates with your sales and accounting systems.
                        </p>
                        <p className="text-foreground leading-relaxed mb-4">
                            For growing businesses, <Link to="/inventory-management" className="text-primary hover:underline">effective inventory management</Link> is critical. The right software eliminates manual errors, saves hours of administrative work, and provides the data you need to make informed business decisions. Whether you're managing one warehouse or multiple locations, inventory software scales with your business.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            Stockwise goes beyond basic inventory tracking by integrating with accounting, providing detailed analytics, and offering features specifically designed for <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">small and medium businesses</Link> in India and globally.
                        </p>
                    </section>

                    {/* Key Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Key Features to Look for in Inventory Software</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            When evaluating inventory management software, these features are essential for efficient operations:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Real-Time Inventory Tracking</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        See exact stock levels instantly across all locations. Every sale, purchase, and stock movement updates automatically, giving you accurate data at all times.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Prevents stockouts and overstocking by providing instant visibility into what you have and where it's located.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Warehouse className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Multi-Warehouse Support</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Manage inventory across multiple warehouses, stores, or <Link to="/godown-management-software" className="text-primary hover:underline">godowns</Link> from a single dashboard. Track stock by location and transfer between sites.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Essential for businesses with multiple locations. Provides centralized control while maintaining location-specific visibility.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Automated Reorder Alerts</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Set minimum stock levels and receive automatic alerts when inventory runs low. Never miss a reorder and prevent lost sales from stockouts.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Eliminates manual monitoring and ensures you always have stock to fulfill customer orders. Learn more about <Link to="/inventory-reorder-management" className="text-primary hover:underline">reorder management</Link>.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <ShoppingCart className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Sales & Purchase Integration</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Inventory automatically updates when you create sales orders or purchase orders. No manual data entry or reconciliation needed.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Saves hours of manual work and eliminates errors from duplicate data entry. Keeps inventory and sales perfectly synchronized.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <DollarSign className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Accounting Integration</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Inventory movements automatically update your financial records. Track cost of goods sold, inventory valuation, and maintain accurate books without manual reconciliation.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Ensures financial accuracy and saves time. Critical for tax compliance and financial reporting.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <BarChart3 className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Reports & Analytics</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Generate detailed reports on stock levels, inventory turnover, slow-moving items, and sales performance. Export to PDF or Excel for further analysis.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Why it matters:</strong> Data-driven insights help optimize inventory levels, identify trends, and make better purchasing decisions. Explore <Link to="/inventory-reporting-analytics" className="text-primary hover:underline">inventory analytics</Link>.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Benefits Over Manual Methods */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Benefits of Inventory Software vs Manual Methods</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Moving from spreadsheets or manual tracking to dedicated inventory software delivers immediate, measurable benefits:
                        </p>

                        <div className="overflow-x-auto mb-6">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-border">
                                        <th className="text-left p-4 font-semibold">Feature</th>
                                        <th className="text-left p-4 font-semibold">Manual / Excel</th>
                                        <th className="text-left p-4 font-semibold">Stockwise Software</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Real-time updates</td>
                                        <td className="p-4 text-muted-foreground">Manual entry required after each transaction</td>
                                        <td className="p-4 text-success font-medium">Automatic, instant updates</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Accuracy</td>
                                        <td className="p-4 text-muted-foreground">Prone to human errors, typos, formula mistakes</td>
                                        <td className="p-4 text-success font-medium">99.9% accurate, automated calculations</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Multi-warehouse</td>
                                        <td className="p-4 text-muted-foreground">Complex spreadsheets, difficult to consolidate</td>
                                        <td className="p-4 text-success font-medium">Built-in support, centralized dashboard</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Time spent daily</td>
                                        <td className="p-4 text-muted-foreground">2-4 hours on data entry and reconciliation</td>
                                        <td className="p-4 text-success font-medium">15-30 minutes on oversight and decisions</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Reorder alerts</td>
                                        <td className="p-4 text-muted-foreground">Manual monitoring, easy to miss</td>
                                        <td className="p-4 text-success font-medium">Automated alerts, never miss reorders</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Reporting</td>
                                        <td className="p-4 text-muted-foreground">Manual creation, time-consuming</td>
                                        <td className="p-4 text-success font-medium">Instant reports, one-click generation</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Accounting integration</td>
                                        <td className="p-4 text-muted-foreground">Manual reconciliation required</td>
                                        <td className="p-4 text-success font-medium">Automatic sync, no reconciliation</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Scalability</td>
                                        <td className="p-4 text-muted-foreground">Becomes unmanageable as business grows</td>
                                        <td className="p-4 text-success font-medium">Scales effortlessly with your business</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Mobile access</td>
                                        <td className="p-4 text-muted-foreground">Limited, difficult on mobile devices</td>
                                        <td className="p-4 text-success font-medium">Full access from any device, anywhere</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Cost</td>
                                        <td className="p-4 text-muted-foreground">Free software, but high labor costs</td>
                                        <td className="p-4 text-success font-medium">Low monthly fee, massive time savings</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-primary/10 rounded-lg p-6">
                            <p className="text-foreground leading-relaxed">
                                <strong>Bottom line:</strong> Businesses using inventory software save an average of 15-20 hours per week on inventory management tasks, reduce errors by 95%, and improve inventory accuracy to over 99%. The time and cost savings typically pay for the software within the first month.
                            </p>
                        </div>
                    </section>

                    {/* Use Cases */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Who Should Use Inventory Management Software?</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Inventory software benefits businesses of all sizes and industries. Here's how different business types use Stockwise:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Small Businesses & Startups</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Perfect for businesses outgrowing spreadsheets. Get professional inventory tracking without enterprise complexity or cost. Our <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">small business plan</Link> includes everything you need to manage inventory efficiently.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Easy setup, no technical knowledge required</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Affordable pricing that scales with growth</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Free plan available to get started</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Retailers & E-commerce</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Track inventory across physical stores and online channels. Prevent stockouts during peak seasons and manage product variants efficiently.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Multi-location inventory visibility</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Product variant management</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Sales channel integration</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Wholesalers & Distributors</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Handle large volumes and complex inventory movements. Track stock across <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">multiple warehouses</Link> and manage bulk orders efficiently.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Bulk order processing</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Multi-warehouse stock transfers</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Supplier and client management</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Indian MSMEs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Designed for Indian businesses with GST compliance, <Link to="/godown-management-software" className="text-primary hover:underline">godown management</Link>, and local payment integration. Available in <Link to="/inventory-software-india" className="text-primary hover:underline">India-specific version</Link>.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">GST-compliant reporting</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Razorpay payment integration</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Local support and pricing in INR</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Why Choose Stockwise */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Why Choose Stockwise?</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise stands out from other inventory software with features designed specifically for growing businesses:
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
                                <p className="text-sm text-muted-foreground">
                                    Intuitive interface that your team can learn in minutes. No complex training or technical knowledge required.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Affordable Pricing</h3>
                                <p className="text-sm text-muted-foreground">
                                    Transparent pricing with no hidden fees. Free plan available, lifetime access for just ₹2,499 one-time payment.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">All-in-One Platform</h3>
                                <p className="text-sm text-muted-foreground">
                                    Inventory, sales, purchases, and accounting in one system. No need for multiple disconnected tools.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Real-Time Updates</h3>
                                <p className="text-sm text-muted-foreground">
                                    See inventory changes instantly. Every transaction updates stock levels in real-time across all locations.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Excellent Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    Dedicated customer support via email and chat. We're here to help you succeed.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Powerful Analytics</h3>
                                <p className="text-sm text-muted-foreground">
                                    Detailed reports and insights to optimize inventory levels and improve profitability.
                                </p>
                            </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-6">
                            <p className="text-foreground leading-relaxed mb-3">
                                <strong>Compare Stockwise with competitors:</strong>
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link to="/stockwise-vs-zoho-inventory" className="text-primary hover:underline">
                                    → Stockwise vs Zoho Inventory
                                </Link>
                                <Link to="/stockwise-vs-tally" className="text-primary hover:underline">
                                    → Stockwise vs Tally
                                </Link>
                                <Link to="/inventory-software-comparison" className="text-primary hover:underline">
                                    → Full Software Comparison
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Pricing CTA */}
                    <section className="mb-12">
                        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8">
                            <div className="max-w-3xl mx-auto text-center">
                                <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Inventory Management?</h2>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Join 100+ businesses using Stockwise to streamline inventory operations. Start with our free plan—no credit card required.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                                    <Link to="/auth">
                                        <Button size="lg" className="w-full sm:w-auto">
                                            Start Free Trial
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to="/pricing">
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                            View Pricing Plans
                                        </Button>
                                    </Link>
                                </div>
                                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                        <span>Free plan available</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                        <span>No credit card required</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                        <span>Setup in 5 minutes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Related Pages */}
                    <section className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-xl font-semibold mb-4">Related Resources</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link to="/inventory-management" className="text-primary hover:underline">
                                → What is Inventory Management?
                            </Link>
                            <Link to="/godown-management-software" className="text-primary hover:underline">
                                → Godown Management Software
                            </Link>
                            <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">
                                → Inventory Software for Small Business
                            </Link>
                            <Link to="/inventory-software-india" className="text-primary hover:underline">
                                → Inventory Software India
                            </Link>
                            <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">
                                → Multi-Warehouse Management
                            </Link>
                            <Link to="/inventory-reorder-management" className="text-primary hover:underline">
                                → Reorder Management
                            </Link>
                            <Link to="/inventory-reporting-analytics" className="text-primary hover:underline">
                                → Inventory Analytics
                            </Link>
                            <Link to="/stockwise-vs-zoho-inventory" className="text-primary hover:underline">
                                → Stockwise vs Zoho
                            </Link>
                            <Link to="/stockwise-vs-tally" className="text-primary hover:underline">
                                → Stockwise vs Tally
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

export default InventoryManagementSoftware
