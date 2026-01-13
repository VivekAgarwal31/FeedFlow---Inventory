import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Warehouse, TrendingUp, BarChart3, CheckCircle2, Package, FileText, IndianRupee } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const GodownManagementSoftware = () => {
    // Structured data for SEO - SoftwareApplication + FAQPage
    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Stockwise Godown Management Software",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        },
        "description": "GST-compliant godown management software for Indian businesses. Manage multiple godowns, track stock transfers, and maintain compliance with ease.",
        "featureList": [
            "Multi-godown inventory tracking",
            "GST-compliant reporting",
            "Stock transfer management",
            "MSME-friendly features",
            "Real-time godown visibility",
            "Indian payment integration"
        ]
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is godown management software?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Godown management software is inventory management software specifically designed for Indian businesses. It tracks stock across multiple godowns (warehouses), manages stock transfers, ensures GST compliance, and provides features tailored to MSME operations in India."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between godown and warehouse?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In India, 'godown' and 'warehouse' are often used interchangeably, but godown is the traditional Indian term for a storage facility. Godown management software is warehouse management software adapted for Indian business practices, GST compliance, and local terminology."
                }
            },
            {
                "@type": "Question",
                "name": "Is godown management software GST compliant?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Stockwise godown management software is fully GST-compliant. It generates GST-compliant invoices, maintains proper records for GST filing, tracks inter-godown transfers with appropriate documentation, and provides reports in formats required by Indian tax authorities."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Godown Management Software India | GST-Compliant | Stockwise</title>
                <meta name="description" content="Manage multiple godowns with ease. GST-compliant godown management software for Indian MSMEs. Track stock, transfers, and compliance." />
                <meta name="keywords" content="godown management software, godown software India, warehouse management India, multi-godown inventory, GST compliant godown software, MSME godown management" />
                <link rel="canonical" href="https://stock-wise.in/godown-management-software/" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://stock-wise.in/godown-management-software/" />
                <meta property="og:title" content="Godown Management Software India | GST-Compliant" />
                <meta property="og:description" content="Manage multiple godowns with ease. GST-compliant software for Indian MSMEs." />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(softwareSchema)}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
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
                        <span className="text-foreground">Godown Management Software</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Made for Indian Businesses</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Godown Management Software for Indian Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                            Manage multiple godowns effortlessly with GST-compliant software designed specifically for Indian MSMEs. Track stock across locations, manage transfers, maintain compliance, and streamline operations—all in one platform.
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

                    {/* What is Godown Management */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What is Godown Management Software?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            In India, a godown is a traditional storage facility or warehouse where businesses store inventory. Godown management software is specialized <Link to="/inventory-management-software" className="text-primary hover:underline">inventory management software</Link> designed for Indian businesses, incorporating local terminology, GST compliance, and features specific to MSME operations.
                        </p>
                        <p className="text-foreground leading-relaxed mb-4">
                            Whether you call it a godown, warehouse, or storage facility, managing inventory across multiple locations is complex. You need to track stock levels at each godown, manage transfers between locations, maintain accurate records for GST compliance, and ensure you can fulfill orders from the nearest godown to reduce shipping costs.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            Stockwise provides comprehensive godown management tailored for Indian businesses. Our software understands Indian business practices, supports GST reporting, integrates with Indian payment gateways like Razorpay, and provides local customer support—all at MSME-friendly pricing.
                        </p>
                    </section>

                    {/* Challenges */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Challenges of Managing Multiple Godowns</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Indian businesses managing multiple godowns face unique challenges:
                        </p>

                        <div className="space-y-4 mb-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Lack of Centralized Visibility</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Without proper software, you can't see total inventory across all godowns. Each location maintains separate records, making it impossible to know your actual stock position. This leads to overstocking at some godowns while others face stockouts.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Complex Stock Transfers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Moving stock between godowns requires proper documentation for GST compliance. Manual tracking of transfers is error-prone and time-consuming. You need to maintain accurate records of what was sent, what was received, and update inventory at both locations.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">GST Compliance Complexity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Inter-godown transfers, stock movements, and sales from different locations all have GST implications. Maintaining proper documentation and generating compliant reports manually is extremely difficult and risky.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Inefficient Order Fulfillment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Without visibility into which godown has stock, you might ship from a distant location when a nearby godown has the same item. This increases shipping costs and delivery times, hurting customer satisfaction.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Manual Reconciliation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Reconciling inventory records across multiple godowns is time-consuming. Discrepancies between physical stock and records are common, leading to inaccurate financial statements and poor business decisions.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <p className="text-foreground leading-relaxed">
                            These challenges are why businesses need dedicated <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">multi-warehouse management software</Link> rather than trying to manage godowns with spreadsheets or disconnected systems.
                        </p>
                    </section>

                    {/* Key Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Key Features for Godown Management</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise provides everything you need to manage multiple godowns efficiently:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Warehouse className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Multi-Godown Tracking</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        View inventory across all godowns from a single dashboard. See which godown has stock, how much, and the total across all locations. Filter and search by godown to manage location-specific inventory.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Centralized inventory visibility</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Location-wise stock reports</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Real-time updates across godowns</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Stock Transfer Management</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Transfer stock between godowns with proper documentation. The system automatically updates inventory at both source and destination godowns, maintaining accurate records for compliance.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Automated stock updates</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Transfer documentation for GST</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Complete transfer history</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <FileText className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>GST-Compliant Reporting</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Generate GST-compliant invoices, maintain proper records for tax filing, and produce reports in formats required by Indian tax authorities. Stay compliant without manual effort.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">GST-compliant invoices</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Tax reports for filing</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Audit-ready documentation</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Godown-Wise Analytics</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Analyze performance by godown. See which locations have slow-moving stock, which are most efficient, and optimize inventory distribution across your network.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Location-wise performance reports</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Stock movement analysis</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Inventory optimization insights</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <IndianRupee className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Indian Payment Integration</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Accept payments through Razorpay and other Indian payment gateways. Pricing in INR, local support, and features designed for Indian business practices.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Razorpay integration</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Pricing in Indian Rupees</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Local customer support</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <BarChart3 className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>MSME-Friendly Features</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Designed specifically for small and medium enterprises. Affordable pricing, easy setup, and features that matter for MSMEs without enterprise complexity.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Affordable MSME pricing</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Simple, intuitive interface</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">No technical knowledge required</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Use Cases */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Multi-Godown Use Cases</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Indian businesses use Stockwise godown management software for various scenarios:
                        </p>

                        <div className="space-y-6">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Regional Distribution</h3>
                                <p className="text-muted-foreground">
                                    Maintain godowns in different cities or states to serve regional markets. Track inventory at each location, transfer stock based on regional demand, and fulfill orders from the nearest godown to reduce shipping costs and delivery times.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Wholesale Distribution</h3>
                                <p className="text-muted-foreground">
                                    Wholesalers managing multiple godowns can track bulk inventory, manage transfers to smaller distribution centers, and maintain accurate records for GST compliance across all locations.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Manufacturing with Multiple Plants</h3>
                                <p className="text-muted-foreground">
                                    Manufacturers with production facilities in different locations can track raw materials and finished goods at each plant, manage inter-plant transfers, and optimize inventory distribution.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Retail Chains</h3>
                                <p className="text-muted-foreground">
                                    Retail businesses with multiple stores and central godowns can track inventory at each location, transfer stock to stores based on demand, and maintain centralized visibility across the entire chain.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Import-Export Businesses</h3>
                                <p className="text-muted-foreground">
                                    Businesses importing goods can track inventory at port godowns, bonded warehouses, and distribution centers. Maintain proper documentation for customs and GST compliance.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* FAQs */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What is godown management software?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Godown management software is inventory management software specifically designed for Indian businesses. It tracks stock across multiple godowns (warehouses), manages stock transfers, ensures GST compliance, and provides features tailored to MSME operations in India.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What is the difference between godown and warehouse?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        In India, 'godown' and 'warehouse' are often used interchangeably, but godown is the traditional Indian term for a storage facility. Godown management software is warehouse management software adapted for Indian business practices, GST compliance, and local terminology.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is godown management software GST compliant?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise godown management software is fully GST-compliant. It generates GST-compliant invoices, maintains proper records for GST filing, tracks inter-godown transfers with appropriate documentation, and provides reports in formats required by Indian tax authorities.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Can I manage multiple godowns in different cities?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise supports unlimited godowns across different cities, states, or even countries. You can track inventory at each location, transfer stock between godowns, and view consolidated reports across all locations from a single dashboard.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How does stock transfer between godowns work?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Create a stock transfer request specifying source godown, destination godown, and items to transfer. The system automatically reduces inventory at the source and increases it at the destination. All transfers are documented for GST compliance and audit trails.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is godown management software suitable for MSMEs?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Absolutely. Stockwise is specifically designed for MSMEs with affordable pricing, easy setup, and features that matter for small and medium businesses. You don't need technical expertise or a large budget to get started.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Godown Management?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Join Indian MSMEs using Stockwise to manage multiple godowns efficiently. GST-compliant, affordable, and designed for Indian businesses.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button size="lg">
                                    Start Free Trial
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

                    {/* Related Pages */}
                    <section className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-xl font-semibold mb-4">Related Resources</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link to="/inventory-management" className="text-primary hover:underline">
                                → What is Inventory Management?
                            </Link>
                            <Link to="/inventory-management-software" className="text-primary hover:underline">
                                → Inventory Management Software
                            </Link>
                            <Link to="/inventory-software-india" className="text-primary hover:underline">
                                → Inventory Software India
                            </Link>
                            <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">
                                → Multi-Warehouse Management
                            </Link>
                            <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">
                                → Inventory Software for Small Business
                            </Link>
                            <Link to="/features/inventory-management" className="text-primary hover:underline">
                                → Stockwise Features
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

export default GodownManagementSoftware
