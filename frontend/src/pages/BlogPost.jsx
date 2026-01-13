import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const BlogPost = () => {
    const { slug } = useParams()

    // Blog post data
    const blogPosts = {
        'types-of-inventory-management-systems': {
            title: 'Types of Inventory Management Systems: Complete Guide (2026)',
            description: 'Explore different types of inventory management systems—manual, perpetual, periodic, barcode, RFID, and cloud-based. Find the right system for your business size and needs.',
            date: '2026-01-13',
            readTime: '10 min read',
            author: 'Stockwise Team',
            category: 'Inventory Management',
            keywords: 'types of inventory systems, inventory management systems, perpetual inventory, periodic inventory, barcode inventory, RFID inventory, cloud inventory software'
        },
        'best-inventory-software-for-small-business-india': {
            title: 'Best Inventory Software for Small Business in India (2026)',
            description: 'Discover the top inventory software for Indian small businesses. Compare features, pricing, GST compliance, and find the perfect solution for your MSME.',
            date: '2026-01-12',
            readTime: '12 min read',
            author: 'Stockwise Team',
            category: 'Software Reviews',
            keywords: 'best inventory software India, inventory software for small business, GST inventory software, MSME software, inventory management India'
        },
        'inventory-reports-guide': {
            title: 'Essential Inventory Reports Every Business Needs',
            description: 'Learn about critical inventory reports—stock movement, turnover, valuation, and reorder reports. Use data to optimize inventory and boost profitability.',
            date: '2026-01-11',
            readTime: '9 min read',
            author: 'Stockwise Team',
            category: 'Inventory Management',
            keywords: 'inventory reports, stock reports, inventory turnover, inventory valuation, reorder reports, inventory analytics'
        },
        'warehouse-vs-godown-management': {
            title: 'Warehouse vs Godown Management: Key Differences Explained',
            description: 'Understand the differences between warehouse and godown management in India. Learn terminology, regulatory requirements, and best practices for Indian businesses.',
            date: '2026-01-10',
            readTime: '7 min read',
            author: 'Stockwise Team',
            category: 'Warehouse Management',
            keywords: 'warehouse vs godown, godown management, warehouse management India, godown software, warehouse terminology'
        },
        'how-to-manage-inventory-for-small-businesses': {
            title: 'How to Manage Inventory for Small Businesses (Step-by-Step Guide)',
            description: 'Learn practical strategies to manage inventory effectively for small businesses. Discover common mistakes, step-by-step solutions, and best practices to improve cash flow and profitability.',
            date: '2025-12-31',
            readTime: '8 min read',
            author: 'Stockwise Team',
            category: 'Inventory Management',
            keywords: 'inventory management for small businesses, inventory tracking, stock management, small business inventory, inventory best practices'
        }
    }

    const post = blogPosts[slug]

    // If post doesn't exist, redirect to blog index
    if (!post) {
        return <Navigate to="/blog" replace />
    }

    // Structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date,
        "dateModified": post.date,
        "author": {
            "@type": "Organization",
            "name": post.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "Stockwise",
            "logo": {
                "@type": "ImageObject",
                "url": "https://stock-wise.in/stockwise%20black.webp"
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://stock-wise.in/blog/${slug}`
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>{post.title} | Stockwise Blog</title>
                <meta name="description" content={post.description} />
                <meta name="keywords" content={post.keywords} />
                <link rel="canonical" href={`https://stock-wise.in/blog/${slug}`} />

                {/* Open Graph */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`https://stock-wise.in/blog/${slug}`} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.description} />
                <meta property="article:published_time" content={post.date} />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
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
                                <Button size="sm">Get Started Free</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm text-muted-foreground">
                        <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground">{post.category}</span>
                    </nav>

                    {/* Article Header */}
                    <header className="mb-8">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(post.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {post.readTime}
                            </span>
                        </div>
                    </header>

                    {/* Article Content */}
                    <div className="prose prose-lg max-w-none">
                        {/* Introduction */}
                        <section className="mb-8">
                            <p className="text-lg leading-relaxed mb-4">
                                For small business owners, managing inventory often feels like walking a tightrope. Too much stock ties up cash you could use elsewhere. Too little means lost sales and disappointed customers. Many small businesses start with Excel spreadsheets or even pen and paper, but these manual methods quickly become overwhelming as operations grow.
                            </p>
                            <p className="text-lg leading-relaxed mb-4">
                                The real challenge isn't just tracking what you have—it's knowing when to reorder, understanding which products move fastest, and maintaining accurate records without spending hours on data entry. Poor inventory management directly impacts your bottom line through excess carrying costs, stockouts, and the time wasted reconciling discrepancies.
                            </p>
                        </section>

                        {/* Core Educational Content */}
                        <section className="mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-4">What Inventory Management Really Means</h2>
                            <p className="leading-relaxed mb-4">
                                Inventory management for small businesses is the process of tracking stock from purchase to sale, ensuring you have the right products in the right quantities at the right time. It's not just about counting items—it's about understanding your business flow and making data-driven decisions.
                            </p>
                            <p className="leading-relaxed mb-4">
                                Effective inventory management helps you maintain optimal stock levels, reduce waste, improve cash flow, and provide better customer service. When done right, it becomes a competitive advantage rather than an administrative burden.
                            </p>

                            <h3 className="text-xl sm:text-2xl font-semibold mb-3 mt-6">Common Mistakes Small Businesses Make</h3>
                            <p className="leading-relaxed mb-4">
                                Many small businesses fall into predictable traps that hurt profitability:
                            </p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2 mt-1">•</span>
                                    <span><strong>Overstocking popular items</strong> based on gut feeling rather than data, tying up cash in inventory</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2 mt-1">•</span>
                                    <span><strong>Ignoring slow-moving stock</strong> until it becomes obsolete or expires</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2 mt-1">•</span>
                                    <span><strong>Manual tracking errors</strong> that compound over time, leading to stock discrepancies</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2 mt-1">•</span>
                                    <span><strong>No systematic reorder process</strong>, resulting in emergency purchases at higher prices</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-destructive mr-2 mt-1">•</span>
                                    <span><strong>Disconnected systems</strong> where inventory and accounting don't sync, creating reconciliation headaches</span>
                                </li>
                            </ul>
                            <p className="leading-relaxed">
                                These mistakes don't just create operational headaches—they directly reduce profitability by increasing costs and reducing sales opportunities.
                            </p>
                        </section>

                        {/* Step-by-Step Section */}
                        <section className="mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Step-by-Step Guide to Better Inventory Management</h2>

                            <div className="space-y-6">
                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 1: Conduct a Complete Inventory Audit</h3>
                                    <p className="leading-relaxed">
                                        Start by physically counting everything you have. Compare this against your records to identify discrepancies. This baseline is essential—you can't manage what you don't accurately measure. Document each item's location, quantity, and condition.
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 2: Categorize Your Inventory</h3>
                                    <p className="leading-relaxed">
                                        Group items by type, supplier, or sales velocity. Use ABC analysis: 'A' items are high-value products that need close monitoring, 'B' items are moderate, and 'C' items are low-value but may be high-volume. This helps you prioritize management efforts where they matter most.
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 3: Set Reorder Points and Safety Stock</h3>
                                    <p className="leading-relaxed">
                                        For each product, determine the minimum quantity that triggers a reorder. Factor in lead time from suppliers and sales velocity. Maintain safety stock for critical items to prevent stockouts during demand spikes or supply delays.
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 4: Implement a Tracking System</h3>
                                    <p className="leading-relaxed">
                                        Move beyond spreadsheets to a proper inventory system. Whether you choose dedicated software or an integrated business management platform, ensure it tracks stock movements in real-time, generates alerts, and integrates with your accounting. Tools like <Link to="/features/inventory-management" className="text-primary hover:underline">Stockwise's inventory management</Link> automate these processes, reducing manual work and errors.
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 5: Establish Regular Review Cycles</h3>
                                    <p className="leading-relaxed">
                                        Schedule weekly or monthly inventory reviews. Analyze which items are moving, which are stagnant, and adjust your purchasing accordingly. Regular reviews help you spot trends early and make proactive decisions rather than reactive ones.
                                    </p>
                                </div>

                                <div className="border-l-4 border-primary pl-6">
                                    <h3 className="text-xl font-semibold mb-2">Step 6: Train Your Team</h3>
                                    <p className="leading-relaxed">
                                        Everyone who handles inventory should understand the system and follow consistent procedures. Create simple documentation for receiving stock, recording sales, and conducting counts. Consistency prevents errors and ensures data accuracy.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Soft Product Mention */}
                        <section className="mb-8">
                            <Card className="bg-muted/30">
                                <CardContent className="pt-6">
                                    <p className="leading-relaxed">
                                        Many small businesses find that integrated platforms simplify inventory management significantly. For example, Stockwise combines inventory tracking with accounting, so when you record a sale, both your stock levels and financial records update automatically. This eliminates duplicate data entry and keeps everything synchronized without manual reconciliation.
                                    </p>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Checklist / Summary */}
                        <section className="mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Inventory Management Best Practices Checklist</h2>
                            <Card>
                                <CardContent className="pt-6">
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Conduct regular physical inventory counts to maintain accuracy</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Use data to set reorder points rather than guessing</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Track inventory movements in real-time, not at month-end</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Integrate inventory with accounting to eliminate reconciliation work</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Review slow-moving items monthly and take action</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Maintain safety stock for critical items to prevent stockouts</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Document procedures so your team follows consistent processes</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                            <span>Analyze inventory turnover to optimize cash flow</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Final CTA */}
                        <section className="mb-8">
                            <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                                <h2 className="text-2xl font-bold mb-4">Ready to Streamline Your Inventory?</h2>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Try Stockwise free to manage inventory the smart way.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/auth">
                                        <Button size="lg">
                                            Get Started Free
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Link to="/pricing">
                                        <Button size="lg" variant="outline">
                                            View Pricing
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Back to Blog */}
                    <div className="mt-12 pt-8 border-t border-border">
                        <Link to="/blog" className="inline-flex items-center text-primary hover:underline">
                            ← Back to Blog
                        </Link>
                    </div>
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

export default BlogPost
