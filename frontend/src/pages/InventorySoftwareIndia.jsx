import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Package, TrendingUp, CheckCircle2, FileText, IndianRupee, Shield, Users, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const InventorySoftwareIndia = () => {
    // Structured data for SEO
    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Stockwise - Inventory Software India",
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
        "description": "India's trusted inventory software. GST-compliant, affordable pricing, local support. Perfect for MSMEs and growing businesses.",
        "featureList": [
            "GST-compliant invoicing",
            "Multi-godown management",
            "Razorpay payment integration",
            "Indian Rupee pricing",
            "Local customer support",
            "MSME-friendly features"
        ]
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is Stockwise inventory software GST compliant?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Stockwise is fully GST-compliant. It generates GST-compliant invoices with proper GSTIN, HSN codes, and tax calculations. The software maintains records required for GST filing and provides reports in formats accepted by Indian tax authorities."
                }
            },
            {
                "@type": "Question",
                "name": "Does Stockwise support Indian payment gateways?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, Stockwise integrates with Razorpay, India's leading payment gateway. Accept payments via UPI, credit/debit cards, net banking, and wallets. All pricing is in Indian Rupees (INR)."
                }
            },
            {
                "@type": "Question",
                "name": "Is Stockwise suitable for Indian MSMEs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. Stockwise is specifically designed for Indian MSMEs with affordable one-time pricing of ₹2,499 for lifetime access, GST compliance, local support, and features tailored to Indian business practices. A free plan is also available."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Inventory Software India | GST-Compliant | Stockwise</title>
                <meta name="description" content="India's trusted inventory software. GST-compliant, affordable pricing, local support. Perfect for MSMEs and growing businesses." />
                <meta name="keywords" content="inventory software India, inventory management software India, GST inventory software, Indian inventory system, MSME inventory software, inventory software for Indian businesses" />
                <link rel="canonical" href="https://stock-wise.in/inventory-software-india/" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://stock-wise.in/inventory-software-india/" />
                <meta property="og:title" content="Inventory Software India | GST-Compliant | Stockwise" />
                <meta property="og:description" content="India's trusted inventory software. GST-compliant, affordable pricing, local support." />

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
                        <span className="text-foreground">Inventory Software India</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">🇮🇳 Made for India</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Inventory Software India – Made for Indian Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8">
                            India's trusted <Link to="/inventory-management-software" className="text-primary hover:underline">inventory management software</Link> with full GST compliance, local payment integration, and features designed specifically for Indian MSMEs. Manage inventory, sales, purchases, and accounting in one platform—with pricing in INR and local support.
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
                                    View Pricing (INR)
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>GST Compliant</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>Razorpay Integration</span>
                            </div>
                            <div className="flex items-center">
                                <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                <span>Local Support</span>
                            </div>
                        </div>
                    </div>

                    {/* Why Indian Businesses Need Specialized Software */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Why Indian Businesses Need Specialized Inventory Software</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Generic international software often lacks features critical for Indian businesses. GST compliance, local terminology (like "godown" instead of warehouse), Indian payment gateways, and MSME-friendly pricing are essential—but missing from most global solutions.
                        </p>
                        <p className="text-foreground leading-relaxed mb-4">
                            Stockwise is built specifically for the Indian market. We understand Indian business practices, regulatory requirements, and the unique challenges faced by MSMEs. Our software speaks your language, supports your payment methods, and ensures compliance with Indian tax laws.
                        </p>

                        <div className="bg-muted/30 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold mb-4">What Makes Stockwise Different:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>GST Compliance:</strong> Generate GST-compliant invoices with proper GSTIN, HSN codes, and tax calculations automatically</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Indian Terminology:</strong> Uses familiar terms like "godown" and supports Indian business workflows</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Local Payments:</strong> Razorpay integration for UPI, cards, net banking, and wallets</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>MSME Pricing:</strong> Affordable one-time payment of ₹2,499 for lifetime access, designed for small and medium businesses</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Local Support:</strong> Customer support that understands Indian business context and time zones</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Data Compliance:</strong> Meets Indian data protection and privacy regulations</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* GST Compliance */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Complete GST Compliance</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            GST compliance is non-negotiable for Indian businesses. Stockwise ensures every transaction, invoice, and report meets GST requirements:
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <FileText className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>GST-Compliant Invoices</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Automatically generate invoices with all required GST fields: GSTIN, HSN/SAC codes, tax rates, CGST, SGST, IGST calculations, and proper invoice numbering.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Automatic tax calculations</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">GSTIN validation</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">HSN/SAC code support</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <TrendingUp className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>GST Reports</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Generate GSTR-1, GSTR-3B ready reports with one click. Export in formats accepted by GST portal. Maintain complete audit trails for tax authorities.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">GSTR-1 ready reports</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">GSTR-3B summaries</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Export to Excel/PDF</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Package className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Inter-State Transactions</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Automatically handle IGST for inter-state sales and CGST+SGST for intra-state transactions. Proper documentation for stock transfers between states.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Automatic IGST/CGST+SGST</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">E-way bill support</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Place of supply tracking</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary/20">
                                <CardHeader>
                                    <div className="flex items-center mb-2">
                                        <Shield className="h-8 w-8 text-primary mr-3" />
                                        <CardTitle>Audit-Ready Records</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Maintain complete transaction history with timestamps, user logs, and document trails. Ready for GST audits and assessments.
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Complete audit trail</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Document management</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">User activity logs</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Indian Payment Integration */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Indian Payment Gateway Integration</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Accept payments the way Indian customers prefer—UPI, cards, net banking, and wallets—all through Razorpay integration:
                        </p>

                        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 mb-6">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                                        <IndianRupee className="h-6 w-6 text-primary mr-2" />
                                        Payment Methods
                                    </h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>UPI (Google Pay, PhonePe, Paytm)</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Credit & Debit Cards</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Net Banking (All major banks)</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Wallets (Paytm, Mobikwik, etc.)</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                                        <Zap className="h-6 w-6 text-primary mr-2" />
                                        Benefits
                                    </h3>
                                    <ul className="space-y-2 text-muted-foreground">
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Instant payment confirmation</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Automatic invoice generation</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Secure, PCI-DSS compliant</span>
                                        </li>
                                        <li className="flex items-center">
                                            <CheckCircle2 className="h-4 w-4 text-success mr-2" />
                                            <span>Settlement in 2-3 business days</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <p className="text-foreground leading-relaxed">
                            All pricing is transparent and in Indian Rupees. No hidden currency conversion fees or international transaction charges.
                        </p>
                    </section>

                    {/* MSME-Friendly Features */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Built for Indian MSMEs</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise understands the unique needs of Micro, Small, and Medium Enterprises in India:
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mb-6">
                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <IndianRupee className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Affordable Pricing</h3>
                                <p className="text-sm text-muted-foreground">
                                    Free plan available. Lifetime access for just ₹2,499 one-time payment—affordable for MSMEs of all sizes.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Godown Management</h3>
                                <p className="text-sm text-muted-foreground">
                                    Manage multiple <Link to="/godown-management-software" className="text-primary hover:underline">godowns</Link> with ease. Track stock transfers and location-wise inventory.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Local Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    Customer support in Indian time zones. We understand your business context and challenges.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Simple Compliance</h3>
                                <p className="text-sm text-muted-foreground">
                                    GST reporting, tax calculations, and audit trails—all automated. Stay compliant without complexity.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Zap className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
                                <p className="text-sm text-muted-foreground">
                                    No technical expertise required. Intuitive interface designed for Indian business owners.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <TrendingUp className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Scalable</h3>
                                <p className="text-sm text-muted-foreground">
                                    Start small and grow. Add products, locations, and users as your MSME expands.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Testimonials */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Trusted by Indian Businesses</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground mb-4 italic">
                                        "GST compliance was a nightmare with our old system. Stockwise makes it effortless. Invoices are automatically GST-compliant, and reports are ready for filing. Saved us hours every month."
                                    </p>
                                    <p className="font-semibold">— Rajesh Kumar, Mumbai Traders</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground mb-4 italic">
                                        "Managing 3 godowns across different cities was chaos. Stockwise gave us centralized visibility and made stock transfers simple. The Razorpay integration is perfect for our customers."
                                    </p>
                                    <p className="font-semibold">— Priya Sharma, Delhi Distributors</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground mb-4 italic">
                                        "As an MSME, we needed affordable software that actually works. Stockwise is perfect—easy to use, GST-compliant, and the pricing is very reasonable. Highly recommend for small businesses."
                                    </p>
                                    <p className="font-semibold">— Amit Patel, Gujarat Enterprises</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-muted-foreground mb-4 italic">
                                        "The local support makes a huge difference. They understand Indian business practices and respond quickly. Much better than dealing with international support teams."
                                    </p>
                                    <p className="font-semibold">— Sunita Reddy, Hyderabad Wholesale</p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* FAQs */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is Stockwise inventory software GST compliant?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise is fully GST-compliant. It generates GST-compliant invoices with proper GSTIN, HSN codes, and tax calculations. The software maintains records required for GST filing and provides reports in formats accepted by Indian tax authorities.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Does Stockwise support Indian payment gateways?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise integrates with Razorpay, India's leading payment gateway. Accept payments via UPI, credit/debit cards, net banking, and wallets. All pricing is in Indian Rupees (INR).
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is Stockwise suitable for Indian MSMEs?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Absolutely. Stockwise is specifically designed for Indian MSMEs with affordable one-time pricing of ₹2,499 for lifetime access, GST compliance, local support, and features tailored to Indian business practices. A free plan is also available.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Can I manage multiple godowns in different states?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, Stockwise supports unlimited godowns across different states. It automatically handles inter-state GST (IGST) and intra-state GST (CGST+SGST) based on the transaction. Track inventory by location and manage stock transfers with proper documentation.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Is customer support available in Indian time zones?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Yes, our customer support operates in Indian time zones (IST). We understand Indian business context, terminology, and regulatory requirements. Support is available via email and chat.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">How much does Stockwise cost in India?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Stockwise offers a free plan forever. Lifetime access is available for ₹2,499 one-time payment with all premium features. All pricing is transparent in Indian Rupees with no hidden fees. Visit our <Link to="/pricing" className="text-primary hover:underline">pricing page</Link> for details.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Inventory Management?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Join Indian MSMEs using Stockwise for GST-compliant, hassle-free inventory management. Start free today—no credit card required.
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
                                    View Pricing (INR)
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
                            <Link to="/inventory-software-for-small-business" className="text-primary hover:underline">
                                → Inventory Software for Small Business
                            </Link>
                            <Link to="/features/accounting-software" className="text-primary hover:underline">
                                → Accounting Software
                            </Link>
                            <Link to="/pricing" className="text-primary hover:underline">
                                → Pricing Plans
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
        </div >
    )
}

export default InventorySoftwareIndia
