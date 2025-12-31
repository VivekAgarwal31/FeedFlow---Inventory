import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const BlogIndex = () => {
    // Blog posts data
    const blogPosts = [
        {
            slug: 'how-to-manage-inventory-for-small-businesses',
            title: 'How to Manage Inventory for Small Businesses (Step-by-Step Guide)',
            excerpt: 'Learn practical strategies to manage inventory effectively without expensive software. Discover common mistakes and actionable steps to improve your inventory management process.',
            date: '2025-12-31',
            readTime: '8 min read',
            category: 'Inventory Management'
        }
    ]

    // Structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Stockwise Blog",
        "description": "Inventory management tips, accounting best practices, and business insights for small businesses",
        "url": "https://bhagro.site/blog",
        "publisher": {
            "@type": "Organization",
            "name": "Stockwise",
            "logo": {
                "@type": "ImageObject",
                "url": "https://bhagro.site/stockwise%20black.webp"
            }
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Blog - Inventory Management Tips & Business Insights | Stockwise</title>
                <meta name="description" content="Expert tips on inventory management, accounting best practices, and business growth strategies for small businesses. Learn how to optimize your operations with Stockwise." />
                <meta name="keywords" content="inventory management blog, small business tips, accounting advice, inventory best practices, business management" />
                <link rel="canonical" href="https://bhagro.site/blog" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://bhagro.site/blog" />
                <meta property="og:title" content="Blog - Inventory Management Tips & Business Insights | Stockwise" />
                <meta property="og:description" content="Expert tips on inventory management, accounting best practices, and business growth strategies for small businesses." />

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
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <header className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Stockwise Blog
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Practical tips and insights on inventory management, accounting, and growing your business efficiently.
                        </p>
                    </header>

                    {/* Blog Posts List */}
                    <section className="space-y-8">
                        {blogPosts.map((post) => (
                            <Card key={post.slug} className="hover:border-primary transition-colors">
                                <CardHeader>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                                    <CardTitle className="text-2xl mb-2">
                                        <Link
                                            to={`/blog/${post.slug}`}
                                            className="hover:text-primary transition-colors"
                                        >
                                            {post.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        {post.excerpt}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Link to={`/blog/${post.slug}`}>
                                        <Button variant="outline" className="group">
                                            Read More
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    {/* CTA Section */}
                    <section className="mt-16 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Business?</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Put these insights into action with Stockwise. Start managing your inventory and accounting in one powerful platform.
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

export default BlogIndex
