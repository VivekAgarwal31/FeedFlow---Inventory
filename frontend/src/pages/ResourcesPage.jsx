import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, BookOpen, FileText, GitCompare } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const ResourcesPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Resources - Inventory Management Guides | Stockwise</title>
                <meta name="description" content="Explore our comprehensive guides on inventory management, software comparisons, and best practices for small businesses." />
                <link rel="canonical" href="https://stock-wise.in/resources/" />
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
                        <span className="text-foreground">Resources</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Management Resources
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive guides, comparisons, and best practices to help you master inventory management.
                        </p>
                    </div>

                    {/* Learning Guides */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <BookOpen className="h-6 w-6 text-primary mr-2" />
                            <h2 className="text-3xl font-semibold">Learning Guides</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>What is Inventory Management?</CardTitle>
                                    <CardDescription>Complete guide to inventory management fundamentals</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-management">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Inventory Reorder Management</CardTitle>
                                    <CardDescription>Learn how to automate reordering and prevent stockouts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-reorder-management">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Multi-Warehouse Management</CardTitle>
                                    <CardDescription>Manage inventory across multiple locations</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/multi-warehouse-inventory-management">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Inventory Reporting & Analytics</CardTitle>
                                    <CardDescription>Use data to optimize inventory decisions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-reporting-analytics">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Software Guides */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <FileText className="h-6 w-6 text-primary mr-2" />
                            <h2 className="text-3xl font-semibold">Software Guides</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Inventory Management Software</CardTitle>
                                    <CardDescription>Complete guide to choosing inventory software</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-management-software">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Godown Management Software</CardTitle>
                                    <CardDescription>India-focused godown management guide</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/godown-management-software">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>For Small Businesses</CardTitle>
                                    <CardDescription>Inventory software guide for small businesses</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-software-for-small-business">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>For Indian Businesses</CardTitle>
                                    <CardDescription>GST-compliant inventory software for India</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-software-india">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Comparisons */}
                    <section className="mb-12">
                        <div className="flex items-center mb-6">
                            <GitCompare className="h-6 w-6 text-primary mr-2" />
                            <h2 className="text-3xl font-semibold">Software Comparisons</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Stockwise vs Zoho</CardTitle>
                                    <CardDescription>Detailed comparison</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/stockwise-vs-zoho-inventory">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Compare
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Stockwise vs Tally</CardTitle>
                                    <CardDescription>Cloud vs Desktop</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/stockwise-vs-tally">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Compare
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle>Software Comparison</CardTitle>
                                    <CardDescription>Complete buyer's guide</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to="/inventory-software-comparison">
                                        <Button variant="ghost" className="w-full justify-between">
                                            Read Guide
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Try Stockwise free and see how easy inventory management can be.
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
                </div>
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

export default ResourcesPage
