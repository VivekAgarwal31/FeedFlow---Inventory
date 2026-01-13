import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Bell, TrendingDown, Package, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const InventoryReorderManagement = () => {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is inventory reorder management?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inventory reorder management is the process of automatically tracking stock levels and triggering purchase orders when inventory falls below predetermined minimum levels. It prevents stockouts by ensuring timely reordering of products."
                }
            },
            {
                "@type": "Question",
                "name": "How do reorder points work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A reorder point is the minimum stock level that triggers a purchase order. When inventory falls to this level, the system alerts you to reorder. The reorder point is calculated based on lead time (how long it takes to receive stock) and daily sales rate."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Reorder Management | Automated Stock Alerts</title>
                <meta name="description" content="Automate inventory reordering with smart alerts. Never run out of stock. Set reorder points, get alerts, and optimize inventory levels." />
                <meta name="keywords" content="inventory reorder management, reorder point, stock alerts, automated reordering, inventory alerts, reorder level" />
                <link rel="canonical" href="https://stock-wise.in/inventory-reorder-management/" />

                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://stock-wise.in/inventory-reorder-management/" />
                <meta property="og:title" content="Inventory Reorder Management | Automated Stock Alerts" />
                <meta property="og:description" content="Automate inventory reordering with smart alerts. Never run out of stock." />

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
                            <Link to="/pricing" className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Pricing
                            </Link>
                            <Link to="/auth">
                                <Button size="sm">Start Free</Button>
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
                        <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
                        <span>/</span>
                        <span className="text-foreground">Reorder Management</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Automated Reordering</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Reorder Management: Never Run Out of Stock
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                            Automate inventory reordering with intelligent alerts. Set reorder points, receive timely notifications, and ensure you always have stock when customers need it—without manual monitoring.
                        </p>
                        <Link to="/auth">
                            <Button size="lg">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* What is Reorder Management */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What is Inventory Reorder Management?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Inventory reorder management is the automated process of tracking stock levels and triggering purchase orders when inventory falls below predetermined minimum levels. Instead of manually checking stock daily, <Link to="/inventory-management-software" className="text-primary hover:underline">inventory software</Link> monitors levels automatically and alerts you when it's time to reorder.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            This prevents stockouts (running out of products), reduces excess inventory (overstocking), and ensures optimal stock levels—all without constant manual oversight.
                        </p>
                    </section>

                    {/* The Problem */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">The Cost of Manual Reordering</h2>
                        <div className="bg-destructive/10 border-l-4 border-destructive rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold mb-4 flex items-center">
                                <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
                                Without Automated Reorder Management:
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2">✗</span>
                                    <span className="text-foreground"><strong>Stockouts:</strong> Running out of popular items, losing sales and customers</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2">✗</span>
                                    <span className="text-foreground"><strong>Manual monitoring:</strong> Spending hours checking stock levels across products</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2">✗</span>
                                    <span className="text-foreground"><strong>Missed reorders:</strong> Forgetting to reorder until it's too late</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2">✗</span>
                                    <span className="text-foreground"><strong>Emergency orders:</strong> Paying premium prices for rush deliveries</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2">✗</span>
                                    <span className="text-foreground"><strong>Overstocking:</strong> Ordering too much to avoid stockouts, tying up cash</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* How It Works */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">How Reorder Management Works</h2>
                        <div className="space-y-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-3">1</div>
                                        <CardTitle>Set Reorder Points</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Define the minimum stock level for each product. When inventory falls to this level, the system triggers an alert. Calculate reorder points based on lead time (how long it takes to receive stock) and average daily sales.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-3">2</div>
                                        <CardTitle>Automatic Monitoring</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        The software continuously tracks inventory levels in real-time. Every sale, purchase, or stock adjustment automatically updates inventory counts. No manual checking required.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-3">3</div>
                                        <CardTitle>Instant Alerts</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        When stock falls to the reorder point, you receive immediate notifications via email, dashboard alerts, or mobile app. Know exactly what to reorder and when.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-3">4</div>
                                        <CardTitle>Create Purchase Orders</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Generate purchase orders directly from reorder alerts. The system can suggest optimal order quantities based on historical sales data and supplier minimums.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Key Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Stockwise Reorder Management Features</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Bell className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Smart Alerts</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Receive instant notifications when stock reaches reorder points. Alerts via email, dashboard, and mobile app ensure you never miss a reorder.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Real-time notifications</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Multi-channel alerts</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Customizable thresholds</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Reorder Quantity Suggestions</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Get intelligent suggestions for how much to reorder based on sales velocity, lead time, and supplier minimum order quantities.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Data-driven recommendations</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Supplier MOQ consideration</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Seasonal adjustments</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingDown className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Low Stock Reports</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        View all products approaching reorder points in one dashboard. Prioritize reorders and plan purchases efficiently. Learn more about <Link to="/inventory-reporting-analytics" className="text-primary hover:underline">inventory reporting</Link>.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Consolidated view</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Priority sorting</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Export to Excel</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <CheckCircle2 className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Multi-Location Support</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Set different reorder points for each warehouse or <Link to="/godown-management-software" className="text-primary hover:underline">godown</Link>. Manage reordering across multiple locations from one dashboard.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Location-specific points</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Stock transfer suggestions</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Centralized oversight</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Benefits */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Benefits of Automated Reorder Management</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Prevent Stockouts</h3>
                                <p className="text-sm text-muted-foreground">
                                    Never run out of popular items. Timely alerts ensure you reorder before stock depletes.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingDown className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Reduce Excess Inventory</h3>
                                <p className="text-sm text-muted-foreground">
                                    Order optimal quantities based on data, not guesswork. Free up cash tied in excess stock.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Save Time</h3>
                                <p className="text-sm text-muted-foreground">
                                    Eliminate manual stock checking. Automated alerts save hours every week.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Automate Your Reordering Today</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Stop manually checking stock levels. Let Stockwise alert you when it's time to reorder. Start free today.
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

                    {/* Related */}
                    <section className="mt-12 pt-8 border-t border-border">
                        <h3 className="text-xl font-semibold mb-4">Related Features</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link to="/inventory-management" className="text-primary hover:underline">
                                → Inventory Management
                            </Link>
                            <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">
                                → Multi-Warehouse Management
                            </Link>
                            <Link to="/inventory-reporting-analytics" className="text-primary hover:underline">
                                → Inventory Reporting
                            </Link>
                            <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">
                                → Software for Small Business
                            </Link>
                            <Link to="/features/inventory-management" className="text-primary hover:underline">
                                → All Features
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

export default InventoryReorderManagement
