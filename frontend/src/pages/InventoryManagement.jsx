import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Package, BarChart3, TrendingUp, CheckCircle2, Warehouse } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const InventoryManagement = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Management Software for Modern Businesses | Stockwise</title>
                <meta name="description" content="Streamline your inventory with Stockwise's cloud-based inventory management software. Real-time tracking, stock alerts, and automated updates for growing businesses." />
                <meta name="keywords" content="inventory management software, stock management, inventory tracking, warehouse management, inventory control system, stock tracking software" />
                <link rel="canonical" href="https://bhagro.site/features/inventory-management" />
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

            {/* Breadcrumb */}
            <div className="border-b border-border bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span>/</span>
                        <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
                        <span>/</span>
                        <span className="text-foreground">Inventory Management</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Management Software for Modern Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Managing inventory manually leads to stock mismatches, data entry errors, and lost sales opportunities. Excel spreadsheets become overwhelming as your business grows, making it difficult to track stock levels across multiple warehouses. Stockwise offers a cloud-based inventory management solution that eliminates these challenges, providing real-time visibility and automated tracking for businesses of all sizes.
                        </p>
                    </div>

                    {/* What Is Inventory Management */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What Is Inventory Management?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Inventory management is the process of ordering, storing, tracking, and controlling your business's stock. It ensures you have the right products in the right quantities at the right time, preventing both stockouts and overstocking.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            For growing businesses, effective inventory management means knowing exactly what you have, where it's located, and when to reorder. It's the foundation of smooth operations, helping you fulfill customer orders promptly while minimizing storage costs and reducing waste.
                        </p>
                    </section>

                    {/* How Stockwise Simplifies */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">How Stockwise Simplifies Inventory Management</h2>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card>
                                <CardHeader>
                                    <Package className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Real-Time Stock Tracking</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Monitor your inventory levels in real-time across all warehouses. Every sale, purchase, and stock movement is automatically recorded, giving you accurate, up-to-date information.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Stock In / Stock Out</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Easily record incoming and outgoing stock with intuitive forms. Track deliveries, returns, and transfers between warehouses with complete audit trails.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <BarChart3 className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Item-Wise Visibility</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        View detailed information for each inventory item, including current stock levels, location, purchase history, and sales performance.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Warehouse className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Accuracy & Automation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Eliminate manual errors with automated stock updates. When you create a sale or purchase, inventory levels adjust automatically, ensuring data accuracy.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Key Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Key Inventory Features</h2>
                        <div className="bg-muted/30 rounded-lg p-6 mb-6">
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Real-time stock updates:</strong> Inventory levels update instantly with every transaction, giving you accurate data at all times.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Sales & purchase linked inventory:</strong> Stock automatically adjusts when you create sales orders or purchase orders, maintaining perfect synchronization.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Low-stock visibility:</strong> Quickly identify items running low and reorder before stockouts occur, preventing lost sales.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Item categorization:</strong> Organize inventory by categories, making it easy to find and manage products.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Multi-warehouse support:</strong> Manage stock across multiple locations from a single dashboard, with warehouse-specific reporting.</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Stock movement tracking:</strong> Transfer inventory between warehouses and maintain complete movement history.</span>
                                </li>
                            </ul>
                        </div>
                        <p className="text-foreground leading-relaxed">
                            Stockwise integrates inventory management with <Link to="/features/accounting-software" className="text-primary hover:underline">accounting features</Link>, ensuring your financial records stay synchronized with stock movements. Explore our <Link to="/pricing" className="text-primary hover:underline">pricing plans</Link> to find the right fit for your business.
                        </p>
                    </section>

                    {/* Who Should Use */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Who Should Use Stockwise?</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Small Businesses</h3>
                                <p className="text-muted-foreground">
                                    Perfect for small businesses outgrowing spreadsheets and needing professional inventory tracking without complex enterprise systems.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Retailers</h3>
                                <p className="text-muted-foreground">
                                    Ideal for retail stores managing product inventory, tracking sales, and maintaining optimal stock levels across locations.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Wholesalers</h3>
                                <p className="text-muted-foreground">
                                    Designed for wholesale businesses handling large volumes, multiple warehouses, and complex inventory movements.
                                </p>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-3">Growing Companies</h3>
                                <p className="text-muted-foreground">
                                    Scalable solution for businesses experiencing growth and needing reliable systems to support expansion.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Comparison */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Inventory Management vs Traditional Methods</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left p-4 font-semibold">Feature</th>
                                        <th className="text-left p-4 font-semibold">Manual / Excel</th>
                                        <th className="text-left p-4 font-semibold">Stockwise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Real-time updates</td>
                                        <td className="p-4 text-muted-foreground">Manual entry required</td>
                                        <td className="p-4 text-success font-medium">Automatic</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Accuracy</td>
                                        <td className="p-4 text-muted-foreground">Prone to errors</td>
                                        <td className="p-4 text-success font-medium">99.9% accurate</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Multi-warehouse</td>
                                        <td className="p-4 text-muted-foreground">Complex spreadsheets</td>
                                        <td className="p-4 text-success font-medium">Built-in support</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Time spent</td>
                                        <td className="p-4 text-muted-foreground">Hours per day</td>
                                        <td className="p-4 text-success font-medium">Minutes per day</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Reporting</td>
                                        <td className="p-4 text-muted-foreground">Manual creation</td>
                                        <td className="p-4 text-success font-medium">Instant reports</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-foreground leading-relaxed mt-6">
                            Traditional inventory methods consume valuable time and increase the risk of costly errors. Stockwise automates routine tasks, reduces manual work by up to 80%, and provides the accuracy your business needs to grow confidently.
                        </p>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Inventory Management?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Join hundreds of businesses using Stockwise to streamline their inventory operations. Start with our free plan today.
                        </p>
                        <Link to="/auth">
                            <Button size="lg">
                                Get Started Free
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

export default InventoryManagement
