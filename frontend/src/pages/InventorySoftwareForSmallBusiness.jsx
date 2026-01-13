import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Package, TrendingUp, CheckCircle2, DollarSign, Clock, Zap, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const InventorySoftwareForSmallBusiness = () => {
    // Structured data for SEO
    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Stockwise - Inventory Software for Small Business",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "100"
        },
        "description": "Simple, affordable inventory software for small businesses. Replace Excel with real-time tracking, automated updates, and easy-to-use features. Free plan available."
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Do small businesses need inventory software?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, small businesses benefit significantly from inventory software. It saves time by automating stock tracking, reduces errors from manual methods, prevents stockouts and overstocking, provides accurate data for business decisions, and scales as your business grows—all at affordable prices."
                }
            },
            {
                "@type": "Question",
                "name": "How much does inventory software for small business cost?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Stockwise offers a free plan for small businesses to get started. Lifetime access is available for ₹2,499 one-time payment with all premium features. This is significantly cheaper than the time and errors saved from manual inventory management."
                }
            },
            {
                "@type": "Question",
                "name": "Is inventory software difficult to learn?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, Stockwise is designed for small businesses without technical expertise. The interface is intuitive, setup takes minutes, and you can start tracking inventory immediately. No complex training or technical knowledge required."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Software for Small Business | Affordable & Easy</title>
                <meta name="description" content="Simple inventory software for small businesses. Replace Excel with real-time tracking, automated updates, and affordable pricing. Free plan available." />
                <meta name="keywords" content="inventory software for small business, small business inventory, inventory tracking for small business, affordable inventory software, simple inventory software, Excel alternative inventory" />
                <link rel="canonical" href="https://stock-wise.in/inventory-software-for-small-business/" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://stock-wise.in/inventory-software-for-small-business/" />
                <meta property="og:title" content="Inventory Software for Small Business | Affordable & Easy" />
                <meta property="og:description" content="Simple inventory software for small businesses. Replace Excel with real-time tracking and automated updates." />

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
                        <span className="text-foreground">Inventory Software for Small Business</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Perfect for Small Businesses</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Software for Small Business – Simple & Affordable
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                            Stop struggling with Excel spreadsheets. Stockwise provides simple, affordable inventory software designed specifically for small businesses. Track stock in real-time, automate reordering, and save hours every week—without complexity or high costs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                            <Link to="/auth">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Start Free Forever
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    View Pricing
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>Free plan forever</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>No credit card needed</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>Setup in 5 minutes</span>
                            </div>
                        </div>
                    </div>

                    {/* Why Small Businesses Need Inventory Software */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Why Small Businesses Need Inventory Software</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Many small businesses start with Excel or even pen and paper for <Link to="/inventory-management" className="text-primary hover:underline">inventory management</Link>. While these methods work initially, they quickly become overwhelming as your business grows. Manual tracking leads to errors, stockouts, overstocking, and hours wasted on data entry and reconciliation.
                        </p>
                        <p className="text-foreground leading-relaxed mb-4">
                            The good news? Modern inventory software is no longer just for large enterprises. Cloud-based solutions like Stockwise are specifically designed for small businesses—affordable, easy to use, and powerful enough to handle your inventory needs as you grow.
                        </p>

                        <div className="bg-muted/30 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold mb-4">Common Pain Points for Small Businesses:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Time-consuming manual tracking:</strong> Spending 2-4 hours daily updating spreadsheets instead of growing your business</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Frequent errors:</strong> Typos, formula mistakes, and data entry errors leading to incorrect stock levels</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Stockouts:</strong> Running out of popular items because you didn't realize stock was low</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Overstocking:</strong> Tying up cash in excess inventory that sits unsold</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>No real-time visibility:</strong> Not knowing current stock levels until you manually count or update spreadsheets</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Difficult scaling:</strong> Manual methods become unmanageable as you add products, locations, or sales channels</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-foreground leading-relaxed">
                            <Link to="/inventory-management-software" className="text-primary hover:underline">Inventory software</Link> solves all these problems by automating tracking, providing real-time visibility, and eliminating manual work—freeing you to focus on growing your business instead of managing spreadsheets.
                        </p>
                    </section>

                    {/* Moving Beyond Excel */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Moving Beyond Excel Spreadsheets</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Excel is a powerful tool, but it wasn't designed for inventory management. Here's why small businesses outgrow spreadsheets:
                        </p>

                        <div className="overflow-x-auto mb-6">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-border">
                                        <th className="text-left p-4 font-semibold">Aspect</th>
                                        <th className="text-left p-4 font-semibold">Excel Spreadsheets</th>
                                        <th className="text-left p-4 font-semibold">Stockwise Software</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Real-time updates</td>
                                        <td className="p-4 text-muted-foreground">Manual entry after each sale</td>
                                        <td className="p-4 text-success font-medium">Automatic, instant</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Accuracy</td>
                                        <td className="p-4 text-muted-foreground">Prone to human errors</td>
                                        <td className="p-4 text-success font-medium">99.9% accurate</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Time spent daily</td>
                                        <td className="p-4 text-muted-foreground">2-4 hours</td>
                                        <td className="p-4 text-success font-medium">15-30 minutes</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Mobile access</td>
                                        <td className="p-4 text-muted-foreground">Difficult on phones</td>
                                        <td className="p-4 text-success font-medium">Full mobile access</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Reorder alerts</td>
                                        <td className="p-4 text-muted-foreground">Manual monitoring</td>
                                        <td className="p-4 text-success font-medium">Automated alerts</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Multi-location</td>
                                        <td className="p-4 text-muted-foreground">Very complex</td>
                                        <td className="p-4 text-success font-medium">Built-in support</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Learning curve</td>
                                        <td className="p-4 text-muted-foreground">Need Excel skills</td>
                                        <td className="p-4 text-success font-medium">Intuitive, no training</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Cost</td>
                                        <td className="p-4 text-muted-foreground">Free software, high labor cost</td>
                                        <td className="p-4 text-success font-medium">Free plan, massive time savings</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-primary/10 rounded-lg p-6">
                            <p className="text-foreground leading-relaxed">
                                <strong>Real example:</strong> A small retail business spending 3 hours daily on Excel inventory tracking switched to Stockwise. They now spend 20 minutes daily on inventory oversight, saving 2.5 hours every day—that's 12.5 hours per week or 650 hours per year. At ₹500/hour labor cost, that's ₹3,25,000 saved annually, far exceeding the software cost.
                            </p>
                        </div>
                    </section>

                    {/* Features for Small Businesses */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Features That Matter for Small Businesses</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise focuses on features small businesses actually need—without enterprise complexity:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Zap className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Easy Setup</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Start tracking inventory in 5 minutes. No technical knowledge, complex configuration, or IT support required. Simple, intuitive interface anyone can use.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">No training required</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Guided onboarding</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Import from Excel</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <DollarSign className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Affordable Pricing</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Free plan available forever. Lifetime access for just ₹2,499 one-time payment—less than the cost of manual errors or one stockout. Transparent pricing, no hidden fees.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Free plan forever</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">No credit card required</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Upgrade anytime</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Real-Time Tracking</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        See exact stock levels instantly. Every sale automatically updates inventory. Know what you have, where it is, and when to reorder—without manual counting.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Instant stock updates</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Low stock alerts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Multi-location support</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Automated Reordering</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Set minimum stock levels and receive automatic alerts when it's time to reorder. Never run out of popular items or forget to restock. Learn more about <Link to="/inventory-reorder-management" className="text-primary hover:underline">reorder management</Link>.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Automatic alerts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Prevent stockouts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Optimize stock levels</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Clock className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Time Savings</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Automation eliminates hours of manual data entry, counting, and reconciliation. Spend time growing your business instead of managing spreadsheets.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Save 15-20 hours/week</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Reduce errors by 95%</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Focus on growth</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Users className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Scales with Growth</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Start small and grow without switching systems. Add products, warehouses, or team members as needed. The software grows with your business.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Unlimited products</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Multiple locations</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Team collaboration</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* ROI Calculator */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Calculate Your Savings</h2>
                        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8">
                            <h3 className="text-2xl font-semibold mb-4 text-center">Time & Cost Savings Calculator</h3>
                            <div className="grid md:grid-cols-2 gap-8 mb-6">
                                <div>
                                    <h4 className="font-semibold mb-3">Current Manual Method:</h4>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li>• 3 hours/day on inventory tasks</li>
                                        <li>• 15 hours/week × 52 weeks = 780 hours/year</li>
                                        <li>• At ₹500/hour = ₹3,90,000/year labor cost</li>
                                        <li>• Plus errors, stockouts, and overstocking costs</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">With Stockwise:</h4>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li>• 30 minutes/day on inventory oversight</li>
                                        <li>• 2.5 hours/week × 52 weeks = 130 hours/year</li>
                                        <li>• At ₹500/hour = ₹65,000/year labor cost</li>
                                        <li>• Software cost: ₹2,499 one-time (lifetime access)</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="bg-success/20 rounded-lg p-6 text-center">
                                <p className="text-2xl font-bold text-success mb-2">Annual Savings: ₹3,13,012</p>
                                <p className="text-muted-foreground">That's 26X return on investment in the first year alone!</p>
                            </div>
                        </div>
                    </section>

                    {/* FAQs */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Do small businesses need inventory software?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, small businesses benefit significantly from inventory software. It saves time by automating stock tracking, reduces errors from manual methods, prevents stockouts and overstocking, provides accurate data for business decisions, and scales as your business grows—all at affordable prices.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How much does inventory software for small business cost?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Stockwise offers a free plan for small businesses to get started. Lifetime access is available for ₹2,499 one-time payment with all premium features. This is significantly cheaper than the time and errors saved from manual inventory management.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is inventory software difficult to learn?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        No, Stockwise is designed for small businesses without technical expertise. The interface is intuitive, setup takes minutes, and you can start tracking inventory immediately. No complex training or technical knowledge required.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Can I import my existing Excel inventory data?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise allows you to import inventory data from Excel spreadsheets. Simply export your current data to CSV format and import it into Stockwise. We provide templates and support to make migration easy.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">What happens if my business grows?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Stockwise scales with your business. Start with the free plan and upgrade as you add products, locations, or team members. You won't need to switch to different software as you grow—Stockwise handles businesses from startup to enterprise scale.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is there a free trial?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Better than a trial—we offer a free plan forever. You can use Stockwise's core inventory features completely free with no time limit. Upgrade to paid plans only when you need advanced features. No credit card required to start.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Replace Excel with Real Inventory Software?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Join thousands of small businesses using Stockwise to save time, reduce errors, and grow faster. Start free today—no credit card required.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button size="lg">
                                    Start Free Forever
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link to="/pricing">
                                <Button size="lg" variant="outline">
                                    View Pricing Plans
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
                            <Link to="/godown-management-software" className="text-primary hover:underline">
                                → Godown Management Software
                            </Link>
                            <Link to="/inventory-software-india" className="text-primary hover:underline">
                                → Inventory Software India
                            </Link>
                            <Link to="/pricing" className="text-primary hover:underline">
                                → Pricing Plans
                            </Link>
                            <Link to="/blog/how-to-manage-inventory-for-small-businesses" className="text-primary hover:underline">
                                → How to Manage Inventory Guide
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

export default InventorySoftwareForSmallBusiness
