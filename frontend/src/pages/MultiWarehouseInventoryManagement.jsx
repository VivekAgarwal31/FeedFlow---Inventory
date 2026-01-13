import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Warehouse, TrendingUp, Package, CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const MultiWarehouseInventoryManagement = () => {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is multi-warehouse inventory management?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Multi-warehouse inventory management is the ability to track and manage inventory across multiple storage locations (warehouses, stores, or godowns) from a single system. It provides centralized visibility, enables stock transfers, and optimizes inventory distribution across locations."
                }
            },
            {
                "@type": "Question",
                "name": "Why do businesses need multi-warehouse management?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Businesses with multiple locations need multi-warehouse management to: see total inventory across all locations, prevent duplicate orders, transfer stock between locations, fulfill orders from the nearest warehouse, and maintain accurate records for each location."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Multi-Warehouse Inventory Management | Track Multiple Locations</title>
                <meta name="description" content="Manage inventory across multiple warehouses. Centralized visibility, stock transfers, location-wise tracking. Perfect for multi-location businesses." />
                <meta name="keywords" content="multi-warehouse inventory, multiple warehouse management, multi-location inventory, warehouse inventory software, multi-site inventory" />
                <link rel="canonical" href="https://stock-wise.in/multi-warehouse-inventory-management/" />

                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://stock-wise.in/multi-warehouse-inventory-management/" />
                <meta property="og:title" content="Multi-Warehouse Inventory Management | Track Multiple Locations" />
                <meta property="og:description" content="Manage inventory across multiple warehouses with centralized visibility and control." />

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
                        <span className="text-foreground">Multi-Warehouse Management</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Multi-Location Tracking</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Multi-Warehouse Inventory Management
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                            Track inventory across multiple warehouses, stores, or <Link to="/godown-management-software" className="text-primary hover:underline">godowns</Link> from one centralized system. Get complete visibility, manage stock transfers, and optimize inventory distribution across all locations.
                        </p>
                        <Link to="/auth">
                            <Button size="lg">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* What is Multi-Warehouse */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What is Multi-Warehouse Inventory Management?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Multi-warehouse inventory management is the ability to track and manage inventory across multiple storage locations from a single system. Whether you call them warehouses, stores, distribution centers, or godowns, multi-warehouse software provides centralized visibility and control over all your inventory locations.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            Instead of maintaining separate records for each location, <Link to="/inventory-management-software" className="text-primary hover:underline">inventory software</Link> consolidates everything into one dashboard. You can see total inventory across all locations, track stock at each warehouse, transfer inventory between locations, and fulfill orders from the nearest warehouse—all from one platform.
                        </p>
                    </section>

                    {/* Challenges */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Challenges Without Multi-Warehouse Management</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">No Centralized Visibility</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Each warehouse maintains separate records. You can't see total inventory or know which location has stock without checking multiple systems or spreadsheets.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Duplicate Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Without knowing total inventory, you might order products that are already in stock at another warehouse, wasting money on unnecessary purchases.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Inefficient Fulfillment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        You might ship from a distant warehouse when a closer one has the same item, increasing shipping costs and delivery times.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Complex Stock Transfers</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Moving inventory between warehouses requires manual documentation and updating multiple records, leading to errors and delays.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Key Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Multi-Warehouse Features in Stockwise</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Warehouse className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Centralized Dashboard</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        View inventory across all warehouses from one dashboard. See total stock, location-wise breakdown, and drill down to specific warehouses instantly.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Consolidated inventory view</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Location-wise filtering</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Real-time updates</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Stock Transfers</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Transfer inventory between warehouses with automatic updates at both locations. Maintain complete transfer history and documentation.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Automatic inventory updates</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Transfer documentation</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Complete audit trail</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <MapPin className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Location-Wise Tracking</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Track every transaction by warehouse. See sales, purchases, and stock movements for each location individually.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Per-location reports</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Location performance metrics</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Stock movement history</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Reorder by Location</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Set different <Link to="/inventory-reorder-management" className="text-primary hover:underline">reorder points</Link> for each warehouse. Get location-specific alerts when stock runs low.
                                    </p>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Location-specific reorder points</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Warehouse-wise alerts</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-3 w-3 text-success mr-2" />
                                            <span>Optimized ordering</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Use Cases */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Multi-Warehouse Use Cases</h2>
                        <div className="space-y-6">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Regional Distribution</h3>
                                <p className="text-muted-foreground">
                                    Maintain warehouses in different cities or states to serve regional markets. Track inventory at each location, transfer stock based on regional demand, and fulfill orders from the nearest warehouse.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Retail Chains</h3>
                                <p className="text-muted-foreground">
                                    Manage inventory across multiple stores and central warehouses. Track stock at each store, transfer inventory to stores based on demand, and maintain centralized visibility.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Wholesale Distribution</h3>
                                <p className="text-muted-foreground">
                                    Wholesalers with multiple distribution centers can track bulk inventory, manage transfers to smaller centers, and optimize inventory distribution across the network.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Manufacturing</h3>
                                <p className="text-muted-foreground">
                                    Track raw materials and finished goods at multiple production facilities. Manage inter-plant transfers and optimize inventory distribution.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Benefits */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Benefits of Multi-Warehouse Management</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Warehouse className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Complete Visibility</h3>
                                <p className="text-sm text-muted-foreground">
                                    See total inventory and location-wise breakdown from one dashboard. Make informed decisions with complete data.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Optimized Distribution</h3>
                                <p className="text-sm text-muted-foreground">
                                    Transfer stock to high-demand locations. Prevent stockouts at some warehouses while others have excess.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Faster Fulfillment</h3>
                                <p className="text-sm text-muted-foreground">
                                    Ship from the nearest warehouse. Reduce shipping costs and delivery times for better customer satisfaction.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Manage Multiple Warehouses Effortlessly</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Get centralized visibility and control over all your inventory locations. Try Stockwise free today.
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
                            <Link to="/godown-management-software" className="text-primary hover:underline">
                                → Godown Management Software
                            </Link>
                            <Link to="/inventory-reorder-management" className="text-primary hover:underline">
                                → Reorder Management
                            </Link>
                            <Link to="/inventory-reporting-analytics" className="text-primary hover:underline">
                                → Inventory Reporting
                            </Link>
                            <Link to="/inventory-management" className="text-primary hover:underline">
                                → Inventory Management
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

export default MultiWarehouseInventoryManagement
