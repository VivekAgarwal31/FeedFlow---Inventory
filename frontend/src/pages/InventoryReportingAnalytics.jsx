import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, BarChart3, TrendingUp, Package, CheckCircle2, PieChart, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const InventoryReportingAnalytics = () => {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What are inventory reports?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inventory reports are data summaries that provide insights into stock levels, movements, valuation, and performance. Common reports include stock movement, inventory turnover, slow-moving items, stock valuation, and reorder reports."
                }
            },
            {
                "@type": "Question",
                "name": "Why are inventory analytics important?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inventory analytics help businesses make data-driven decisions about purchasing, pricing, and stock levels. They identify slow-moving items, optimize inventory turnover, prevent stockouts, reduce excess inventory, and improve profitability."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Reporting & Analytics | Data-Driven Insights</title>
                <meta name="description" content="Powerful inventory reports and analytics. Track stock movement, turnover, valuation, and performance. Make data-driven inventory decisions." />
                <meta name="keywords" content="inventory reports, inventory analytics, stock reports, inventory turnover, inventory valuation, inventory insights" />
                <link rel="canonical" href="https://stock-wise.in/inventory-reporting-analytics/" />

                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://stock-wise.in/inventory-reporting-analytics/" />
                <meta property="og:title" content="Inventory Reporting & Analytics | Data-Driven Insights" />
                <meta property="og:description" content="Powerful inventory reports and analytics for data-driven decisions." />

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
                        <span className="text-foreground">Reporting & Analytics</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Data-Driven Insights</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Reporting & Analytics
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                            Transform inventory data into actionable insights. Track stock movement, analyze turnover, identify slow-moving items, and make data-driven decisions to optimize inventory and boost profitability.
                        </p>
                        <Link to="/auth">
                            <Button size="lg">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* What are Inventory Reports */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What are Inventory Reports & Analytics?</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Inventory reports and analytics transform raw <Link to="/inventory-management" className="text-primary hover:underline">inventory data</Link> into meaningful insights. Instead of just seeing numbers, you understand what's selling, what's not, where your money is tied up, and how to optimize stock levels.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            Good <Link to="/inventory-management-software" className="text-primary hover:underline">inventory software</Link> provides reports on stock movement, inventory turnover, slow-moving items, stock valuation, reorder needs, and location-wise performance. These insights help you make smarter purchasing decisions, reduce waste, and improve cash flow.
                        </p>
                    </section>

                    {/* Essential Reports */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Essential Inventory Reports</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Stock Movement Report</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Track how inventory moves in and out. See purchases, sales, returns, and adjustments over time. Identify trends and seasonal patterns.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Understand which products are moving fast vs. slow, plan seasonal inventory.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <BarChart3 className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Inventory Turnover</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Measure how many times inventory is sold and replaced over a period. Higher turnover means efficient inventory management.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Identify products with healthy turnover vs. those tying up cash.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Slow-Moving Items</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Identify products that haven't sold in 30, 60, or 90 days. Take action to clear slow-moving stock through discounts or promotions.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Free up cash tied in dead stock, make room for better-selling items.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <PieChart className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Stock Valuation</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        See the total value of inventory at cost price. Understand how much capital is tied up in stock and track changes over time.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Financial planning, balance sheet accuracy, inventory optimization.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <FileText className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Reorder Reports</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        View all products approaching or below <Link to="/inventory-reorder-management" className="text-primary hover:underline">reorder points</Link>. Plan purchases efficiently with suggested order quantities.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Prevent stockouts, optimize purchasing, batch orders to suppliers.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <BarChart3 className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Location-Wise Reports</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        For <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">multi-warehouse</Link> businesses, see performance by location. Compare sales, stock levels, and turnover across warehouses.
                                    </p>
                                    <p className="text-sm text-foreground">
                                        <strong>Use case:</strong> Optimize inventory distribution, identify high/low performing locations.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Analytics Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Stockwise Analytics Features</h2>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Real-Time Dashboards</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        View key metrics at a glance: total inventory value, low stock items, top-selling products, and recent transactions. Dashboards update in real-time as inventory changes.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Live Updates</Badge>
                                        <Badge variant="outline">Visual Charts</Badge>
                                        <Badge variant="outline">Key Metrics</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Customizable Date Ranges</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Generate reports for any time period: today, this week, this month, this quarter, this year, or custom date ranges. Compare performance across periods.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Flexible Periods</Badge>
                                        <Badge variant="outline">Period Comparison</Badge>
                                        <Badge variant="outline">Trend Analysis</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Export to Excel & PDF</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Download reports in Excel or PDF format for offline analysis, sharing with stakeholders, or record-keeping. All reports are export-ready.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Excel Export</Badge>
                                        <Badge variant="outline">PDF Export</Badge>
                                        <Badge variant="outline">Easy Sharing</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Filtering & Drill-Down</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Filter reports by product, category, warehouse, supplier, or date range. Drill down into specific data points for detailed analysis.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline">Advanced Filters</Badge>
                                        <Badge variant="outline">Drill-Down Analysis</Badge>
                                        <Badge variant="outline">Multi-Criteria Search</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Benefits */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Benefits of Inventory Analytics</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Better Decisions</h3>
                                <p className="text-sm text-muted-foreground">
                                    Make purchasing and pricing decisions based on data, not guesswork. Reduce risk and improve outcomes.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Optimize Stock</h3>
                                <p className="text-sm text-muted-foreground">
                                    Identify slow-moving items to clear, fast-moving items to stock more of, and optimal inventory levels.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Improve Cash Flow</h3>
                                <p className="text-sm text-muted-foreground">
                                    Reduce capital tied up in excess inventory. Free up cash for growth and other business needs.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Use Cases */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">How Businesses Use Inventory Analytics</h2>
                        <div className="space-y-4">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-lg font-semibold mb-2">Retail: Seasonal Planning</h3>
                                <p className="text-muted-foreground">
                                    Analyze last year's sales data to predict seasonal demand. Stock up on trending items before peak season and avoid overstocking slow movers.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-lg font-semibold mb-2">Wholesale: Supplier Negotiation</h3>
                                <p className="text-muted-foreground">
                                    Use purchase history reports to negotiate better prices with suppliers. Show volume data to get bulk discounts.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-lg font-semibold mb-2">E-commerce: Product Mix Optimization</h3>
                                <p className="text-muted-foreground">
                                    Identify top-selling products and discontinue poor performers. Optimize product mix based on turnover and profitability data.
                                </p>
                            </div>

                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-lg font-semibold mb-2">Manufacturing: Raw Material Planning</h3>
                                <p className="text-muted-foreground">
                                    Track raw material consumption rates and plan purchases to avoid production delays while minimizing storage costs.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Make Data-Driven Inventory Decisions</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Stop guessing. Start using data to optimize inventory, improve cash flow, and boost profitability. Try Stockwise free.
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
                            <Link to="/inventory-reorder-management" className="text-primary hover:underline">
                                → Reorder Management
                            </Link>
                            <Link to="/multi-warehouse-inventory-management" className="text-primary hover:underline">
                                → Multi-Warehouse Management
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

export default InventoryReportingAnalytics
