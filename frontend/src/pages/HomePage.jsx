import React, { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import {
    Package,
    TrendingUp,
    FileText,
    BarChart3,
    Warehouse,
    ShoppingCart,
    DollarSign,
    Users,
    CheckCircle2,
    ArrowRight,
    Menu,
    X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { pricingPlans } from '../lib/pricingPlans'
import { trackCTAClick } from '../hooks/useAnalytics'

const HomePage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true })
        }
    }, [user, navigate])

    // Smooth scroll to section
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
            setMobileMenuOpen(false)
        }
    }

    // Structured data for SEO - SoftwareApplication
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Stockwise",
        "applicationCategory": "BusinessApplication",
        "description": "Smart inventory and accounting management system for modern businesses. Track stock, manage sales & purchases, and handle accounting in one platform.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR"
        }
    }

    // WebSite structured data for brand recognition
    const websiteStructuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Stockwise",
        "alternateName": "Stockwise Inventory Management",
        "url": "https://stock-wise.in"
    }

    return (
        <div className="min-h-screen bg-background">
            {/* SEO Meta Tags */}
            <Helmet>
                <title>Stockwise - Smart Inventory & Accounting Management System</title>
                <meta name="description" content="Streamline your business with Stockwise - comprehensive inventory management, sales tracking, purchase orders, delivery management, and integrated accounting in one powerful platform. Start free today!" />
                <meta name="keywords" content="inventory management software, stock management system, accounting software, warehouse management, sales tracking, purchase orders, business management, inventory tracking, stockwise, inventory software India" />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://stock-wise.in/" />
                <meta property="og:title" content="Stockwise - Smart Inventory & Accounting Management" />
                <meta property="og:description" content="Streamline your business with comprehensive inventory management, sales tracking, and accounting in one platform. Start free today!" />
                <meta property="og:site_name" content="Stockwise" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Stockwise - Smart Inventory & Accounting Management" />
                <meta name="twitter:description" content="Streamline your business with comprehensive inventory management, sales tracking, and accounting in one platform." />

                {/* Canonical URL */}
                <link rel="canonical" href="https://stock-wise.in/" />

                {/* Structured Data - WebSite */}
                <script type="application/ld+json">
                    {JSON.stringify(websiteStructuredData)}
                </script>

                {/* Structured Data - SoftwareApplication */}
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <img
                                src="/stockwise black.webp"
                                alt="Stockwise Logo"
                                width="180"
                                height="48"
                                className="h-12 w-auto"
                            />
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" aria-label="Navigate to Features section">
                                Features
                            </button>
                            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" aria-label="Navigate to Pricing section">
                                Pricing
                            </button>
                            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                                Blog
                            </Link>
                            <button onClick={() => scrollToSection('footer')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" aria-label="Navigate to Contact section">
                                Contact
                            </button>
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/auth">
                                <Button variant="ghost" size="sm">Login</Button>
                            </Link>
                            <Link to="/auth">
                                <Button size="sm">Sign Up</Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 space-y-4 border-t border-border">
                            <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Features
                            </button>
                            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Pricing
                            </button>
                            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                How It Works
                            </button>
                            <Link to="/blog" className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors" onClick={() => setMobileMenuOpen(false)}>
                                Blog
                            </Link>
                            <button onClick={() => scrollToSection('footer')} className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Contact
                            </button>
                            <div className="flex flex-col space-y-2 px-4 pt-2">
                                <Link to="/auth">
                                    <Button variant="outline" className="w-full">Login</Button>
                                </Link>
                                <Link to="/auth">
                                    <Button className="w-full">Sign Up</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-20 sm:py-32 bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge className="mb-2">Smart Business Management</Badge>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                                    Stockwise – Smart Inventory & Accounting Management
                                </h1>
                                <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                                    Streamline your business operations with comprehensive inventory tracking, sales & purchase management, and integrated accounting – all in one powerful platform.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/auth" className="w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        className="w-full min-h-[48px]"
                                        onClick={() => trackCTAClick('Get Started Free', 'hero')}
                                    >
                                        Get Started Free
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto min-h-[48px]"
                                    onClick={() => scrollToSection('features')}
                                >
                                    View Features
                                </Button>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">Free</div>
                                    <div className="text-sm text-muted-foreground">Plan Available</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">99.9%</div>
                                    <div className="text-sm text-muted-foreground">Uptime</div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold text-primary">24/7</div>
                                    <div className="text-sm text-muted-foreground">Support</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Dashboard Preview */}
                        <div className="relative">
                            <div className="relative rounded-lg border border-border bg-card shadow-2xl overflow-hidden">
                                <div className="bg-muted px-4 py-3 border-b border-border flex items-center space-x-2">
                                    <div className="flex space-x-2">
                                        <div className="h-3 w-3 rounded-full bg-destructive"></div>
                                        <div className="h-3 w-3 rounded-full bg-warning"></div>
                                        <div className="h-3 w-3 rounded-full bg-success"></div>
                                    </div>
                                    <div className="flex-1 text-center text-xs text-muted-foreground">Dashboard Preview</div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-primary/10 rounded-md p-4 space-y-2">
                                            <div className="h-2 bg-primary/30 rounded w-20"></div>
                                            <div className="h-6 bg-primary/50 rounded w-24"></div>
                                        </div>
                                        <div className="bg-accent/10 rounded-md p-4 space-y-2">
                                            <div className="h-2 bg-accent/30 rounded w-20"></div>
                                            <div className="h-6 bg-accent/50 rounded w-24"></div>
                                        </div>
                                    </div>
                                    <div className="bg-muted rounded-md p-4 space-y-3">
                                        <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
                                        <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
                                        <div className="h-3 bg-muted-foreground/20 rounded w-4/6"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="h-16 bg-muted rounded-md"></div>
                                        <div className="h-16 bg-muted rounded-md"></div>
                                        <div className="h-16 bg-muted rounded-md"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Highlights */}
            <section className="py-20 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                            <CardHeader>
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Real-time Inventory</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Track stock levels across multiple warehouses in real-time with automated alerts.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                            <CardHeader>
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <ShoppingCart className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Sales & Purchases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Manage orders, deliveries, and transactions with clients and suppliers seamlessly.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                            <CardHeader>
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <DollarSign className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Accounting</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Complete accounting with receivables, payables, cashbook, and ledger management.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                            <CardHeader>
                                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Reports & Analytics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Generate detailed reports, weekly email summaries, and gain actionable insights into your business performance.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features for Your Business</h2>
                        <p className="text-lg text-muted-foreground">
                            Everything you need to manage inventory, sales, purchases, and accounting in one integrated platform.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 - Inventory */}
                        <Card>
                            <CardHeader>
                                <Warehouse className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Inventory Management</CardTitle>
                                <CardDescription>
                                    Complete control over your stock
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Multi-warehouse support</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Stock adjustments & transfers</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Low stock alerts</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Real-time stock tracking</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature 2 - Sales & Purchases */}
                        <Card>
                            <CardHeader>
                                <ShoppingCart className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Sales & Purchase Orders</CardTitle>
                                <CardDescription>
                                    Streamline your order management
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Create & track orders</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Delivery management</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Automated invoicing</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Payment tracking</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature 3 - Accounting */}
                        <Card>
                            <CardHeader>
                                <DollarSign className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Accounting & Ledgers</CardTitle>
                                <CardDescription>
                                    Complete financial management
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Receivables & payables</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Cashbook management</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Entries register</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Financial reports</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature 4 - Reports */}
                        <Card>
                            <CardHeader>
                                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Reports & Analytics</CardTitle>
                                <CardDescription>
                                    Data-driven insights
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Sales & purchase reports</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Weekly email reports</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Inventory analytics</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Export to PDF & Excel</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature 5 - Client & Supplier */}
                        <Card>
                            <CardHeader>
                                <Users className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Client & Supplier Management</CardTitle>
                                <CardDescription>
                                    Build stronger relationships
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Contact management</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Transaction history</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Outstanding balances</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Payment reminders</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature 6 - Data Management */}
                        <Card>
                            <CardHeader>
                                <FileText className="h-10 w-10 text-primary mb-4" />
                                <CardTitle>Data Management</CardTitle>
                                <CardDescription>
                                    Secure backup & restore
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Automated backups</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">One-click restore</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Data export & import</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">Archive management</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
                        <p className="text-lg text-muted-foreground">
                            Get started with Stockwise in four simple steps
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="relative">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                    1
                                </div>
                                <h3 className="text-xl font-semibold">Sign Up</h3>
                                <p className="text-muted-foreground">
                                    Create your free account in seconds. No credit card required.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                    2
                                </div>
                                <h3 className="text-xl font-semibold">Setup Company</h3>
                                <p className="text-muted-foreground">
                                    Add your company details and configure your warehouses.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                    3
                                </div>
                                <h3 className="text-xl font-semibold">Add Inventory</h3>
                                <p className="text-muted-foreground">
                                    Import or manually add your stock items and set quantities.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                                    4
                                </div>
                                <h3 className="text-xl font-semibold">Start Managing</h3>
                                <p className="text-muted-foreground">
                                    Begin tracking sales, purchases, and manage your business efficiently.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-muted/30">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-lg text-muted-foreground">
                            Choose the plan that fits your business needs. Start free, upgrade anytime.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                                    </div>
                                )}
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">{plan.priceLabel}</span>
                                    </div>
                                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link to="/auth" className="block">
                                        <Button
                                            variant={plan.ctaVariant}
                                            className="w-full"
                                        >
                                            {plan.ctaText}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-bold">
                            Ready to Transform Your Business?
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground">
                            Start using Stockwise today to streamline your operations.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/auth">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto"
                                    onClick={() => trackCTAClick('Get Started Free', 'bottom_cta')}
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => scrollToSection('features')}
                            >
                                Learn More
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="footer" className="bg-muted/50 border-t border-border py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                        {/* Brand & Company Info */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="flex items-center">
                                <img
                                    src="/stockwise black.webp"
                                    alt="Stockwise Logo"
                                    width="150"
                                    height="40"
                                    className="h-10 w-auto"
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Smart inventory and accounting management for modern businesses.
                            </p>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>📧 support@stock-wise.in</p>
                                <p>📍 India</p>
                            </div>
                            {/* Social Links Placeholder */}
                            <div className="flex space-x-4">
                                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                                </a>
                                <a href="https://www.linkedin.com/company/stockwise1" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Product */}
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
                                </li>
                                <li>
                                    <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                                </li>
                                <li>
                                    <Link to="/inventory-management-software" className="hover:text-foreground transition-colors">Inventory Software</Link>
                                </li>
                                <li>
                                    <Link to="/godown-management-software" className="hover:text-foreground transition-colors">Godown Management</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <Link to="/about" className="hover:text-foreground transition-colors">About Us</Link>
                                </li>
                                <li>
                                    <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                                </li>
                                <li>
                                    <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                                </li>
                                <li>
                                    <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>
                                    <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                                </li>
                                <li>
                                    <Link to="/terms-and-conditions" className="hover:text-foreground transition-colors">Terms of Service</Link>
                                </li>
                                <li>
                                    <Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
                        <p>&copy; {new Date().getFullYear()} Stockwise. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default HomePage
