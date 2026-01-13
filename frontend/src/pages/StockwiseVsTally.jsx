import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, CheckCircle2, X, Cloud, HardDrive } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const StockwiseVsTally = () => {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Which is better: Stockwise or Tally?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Stockwise is better for businesses wanting modern cloud-based software with mobile access, real-time collaboration, and automatic updates. Tally suits businesses preferring traditional desktop software with one-time purchase. Stockwise offers better accessibility and modern features, while Tally provides offline access."
                }
            },
            {
                "@type": "Question",
                "name": "Is Stockwise cloud-based while Tally is desktop?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Stockwise is cloud-based (accessible from any device, anywhere) while Tally is primarily desktop software (installed on specific computers). Tally offers TallyPrime Server for remote access, but it requires additional setup and cost."
                }
            }
        ]
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Stockwise vs Tally: Cloud vs Desktop Comparison (2026)</title>
                <meta name="description" content="Compare Stockwise cloud software with Tally desktop. Features, pricing, accessibility, and modern capabilities. Find the right fit." />
                <meta name="keywords" content="stockwise vs tally, tally alternative, cloud accounting software India, modern inventory software, tally vs cloud software" />
                <link rel="canonical" href="https://stock-wise.in/stockwise-vs-tally/" />

                <meta property="og:type" content="article" />
                <meta property="og:url" content="https://stock-wise.in/stockwise-vs-tally/" />
                <meta property="og:title" content="Stockwise vs Tally: Modern Cloud vs Traditional Desktop" />
                <meta property="og:description" content="Compare Stockwise and Tally. Cloud vs desktop, pricing models, and capabilities." />

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
                                <Button size="sm">Try Stockwise Free</Button>
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
                        <Link to="/inventory-software-comparison" className="hover:text-foreground transition-colors">Comparisons</Link>
                        <span>/</span>
                        <span className="text-foreground">Stockwise vs Tally</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-5xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-12">
                        <Badge className="mb-4">Cloud vs Desktop 2026</Badge>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Stockwise vs Tally: Modern Cloud vs Traditional Desktop
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            Comprehensive comparison between Stockwise's modern cloud platform and Tally's traditional desktop software. Understand the differences in deployment, pricing, accessibility, and capabilities.
                        </p>
                    </div>

                    {/* Quick Summary */}
                    <section className="mb-12">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-primary/50">
                                <CardHeader>
                                    <div className="flex items-center justify-center mb-2">
                                        <Cloud className="h-12 w-12 text-primary" />
                                    </div>
                                    <CardTitle className="text-center">Stockwise (Cloud)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 text-center">Modern cloud-based platform</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Access from anywhere, any device</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Real-time collaboration</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Automatic updates & backups</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">One-time payment (₹2,499 lifetime)</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Mobile-friendly interface</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-center mb-2">
                                        <HardDrive className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="text-center">Tally (Desktop)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4 text-center">Traditional desktop software</p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Works offline</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">One-time purchase option</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Established in India since 1986</span>
                                        </li>
                                        <li className="flex items-start">
                                            <X className="h-4 w-4 text-destructive mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Tied to specific computers</span>
                                        </li>
                                        <li className="flex items-start">
                                            <X className="h-4 w-4 text-destructive mt-0.5 mr-2 flex-shrink-0" />
                                            <span className="text-sm">Limited mobile access</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Cloud vs Desktop */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Cloud vs Desktop: Key Differences</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-border">
                                        <th className="text-left p-4 font-semibold">Aspect</th>
                                        <th className="text-left p-4 font-semibold">Stockwise (Cloud)</th>
                                        <th className="text-left p-4 font-semibold">Tally (Desktop)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Deployment</td>
                                        <td className="p-4 text-success">Cloud-based, instant access</td>
                                        <td className="p-4">Desktop installation required</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Accessibility</td>
                                        <td className="p-4 text-success">Anywhere, any device</td>
                                        <td className="p-4">Specific computers only</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Mobile access</td>
                                        <td className="p-4 text-success">Full mobile app</td>
                                        <td className="p-4">Limited (requires TallyPrime Server)</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Collaboration</td>
                                        <td className="p-4 text-success">Real-time, multiple users</td>
                                        <td className="p-4">Requires server setup</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Updates</td>
                                        <td className="p-4 text-success">Automatic, always latest</td>
                                        <td className="p-4">Manual updates required</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Backups</td>
                                        <td className="p-4 text-success">Automatic cloud backups</td>
                                        <td className="p-4">Manual backups needed</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">IT requirements</td>
                                        <td className="p-4 text-success">None</td>
                                        <td className="p-4">Installation, maintenance, server (for multi-user)</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Offline access</td>
                                        <td className="p-4">Requires internet</td>
                                        <td className="p-4 text-success">Works offline</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Pricing model</td>
                                        <td className="p-4 text-success">One-time payment (lifetime)</td>
                                        <td className="p-4">One-time or subscription</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4 font-medium">Learning curve</td>
                                        <td className="p-4 text-success">Low, modern UI</td>
                                        <td className="p-4">High, traditional interface</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Pricing Comparison */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Pricing Comparison</h2>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <Card className="border-primary/50">
                                <CardHeader>
                                    <CardTitle>Stockwise Pricing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        <li>
                                            <p className="font-semibold">Free Plan: ₹0</p>
                                            <p className="text-sm text-muted-foreground">Forever free, basic features</p>
                                        </li>
                                        <li>
                                            <p className="font-semibold">Lifetime: ₹2,499 one-time</p>
                                            <p className="text-sm text-muted-foreground">Full features, unlimited products</p>
                                        </li>
                                    </ul>
                                    <p className="text-sm text-success mt-4">✓ Includes accounting, no extra cost</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Tally Pricing</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        <li>
                                            <p className="font-semibold">TallyPrime Silver: ₹18,000</p>
                                            <p className="text-sm text-muted-foreground">One-time, single user</p>
                                        </li>
                                        <li>
                                            <p className="font-semibold">TallyPrime Gold: ₹54,000</p>
                                            <p className="text-sm text-muted-foreground">One-time, multi-user</p>
                                        </li>
                                        <li>
                                            <p className="font-semibold">Subscription: ₹1,500/month</p>
                                            <p className="text-sm text-muted-foreground">Per user, includes updates</p>
                                        </li>
                                    </ul>
                                    <p className="text-sm text-muted-foreground mt-4">+ Server costs for multi-user setup</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-primary/10 rounded-lg p-6">
                            <p className="text-foreground mb-2">
                                <strong>Cost Analysis (3 years):</strong>
                            </p>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>• Stockwise: ₹2,499 one-time (lifetime access)</li>
                                <li>• Tally Silver (one-time): ₹18,000 + updates/support</li>
                                <li>• Tally Subscription: ₹1,500/month × 36 = ₹54,000</li>
                            </ul>
                            <p className="text-foreground mt-3">
                                Stockwise offers better value for cloud access and modern features. Tally's one-time purchase is cheaper if you don't need cloud/mobile access.
                            </p>
                        </div>
                    </section>

                    {/* Feature Comparison */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Feature Comparison</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-border">
                                        <th className="text-left p-4 font-semibold">Feature</th>
                                        <th className="text-center p-4 font-semibold">Stockwise</th>
                                        <th className="text-center p-4 font-semibold">Tally</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Inventory management</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Accounting</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">GST compliance</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Multi-warehouse</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Modern UI</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Mobile app</td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                        <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Ease of use</td>
                                        <td className="p-4 text-center text-success font-medium">High</td>
                                        <td className="p-4 text-center text-muted-foreground">Medium</td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Payroll</td>
                                        <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                    <tr className="border-b border-border">
                                        <td className="p-4">Manufacturing</td>
                                        <td className="p-4 text-center"><X className="h-5 w-5 text-destructive mx-auto" /></td>
                                        <td className="p-4 text-center"><CheckCircle2 className="h-5 w-5 text-success mx-auto" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* When to Choose */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Which Should You Choose?</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-3">Choose Stockwise if:</h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>✓ You need access from multiple devices/locations</li>
                                    <li>✓ You want modern, easy-to-use interface</li>
                                    <li>✓ You prefer cloud-based solutions</li>
                                    <li>✓ You need mobile access</li>
                                    <li>✓ You want automatic backups and updates</li>
                                    <li>✓ You're a small to medium business</li>
                                    <li>✓ You want lower upfront costs</li>
                                </ul>
                            </div>

                            <div className="border-l-4 border-muted-foreground pl-6">
                                <h3 className="text-xl font-semibold mb-3">Choose Tally if:</h3>
                                <ul className="space-y-2 text-muted-foreground">
                                    <li>✓ You need offline access (no internet)</li>
                                    <li>✓ You prefer desktop software</li>
                                    <li>✓ You need payroll features</li>
                                    <li>✓ You're in manufacturing</li>
                                    <li>✓ Your team is already trained on Tally</li>
                                    <li>✓ You prefer one-time purchase</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Experience Modern Cloud Software</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Try Stockwise free and see why businesses are moving from traditional desktop software to modern cloud platforms.
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
                        <h3 className="text-xl font-semibold mb-4">Related Comparisons</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Link to="/stockwise-vs-zoho-inventory" className="text-primary hover:underline">
                                → Stockwise vs Zoho Inventory
                            </Link>
                            <Link to="/inventory-software-comparison" className="text-primary hover:underline">
                                → Full Software Comparison
                            </Link>
                            <Link to="/inventory-management-software" className="text-primary hover:underline">
                                → Inventory Management Software
                            </Link>
                            <Link to="/pricing" className="text-primary hover:underline">
                                → Stockwise Pricing
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

export default StockwiseVsTally
