import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, Target, Users, Shield, Zap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>About Stockwise - Smart Inventory & Accounting Management</title>
                <meta name="description" content="Learn about Stockwise's mission to provide simple, reliable inventory and accounting software for growing businesses. Built for SMEs who need professional tools without complexity." />
                <link rel="canonical" href="https://bhagro.site/about" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img src="/stockwise black.png" alt="Stockwise Logo" className="h-10 w-auto" />
                        </Link>
                        <div className="flex items-center space-x-4">
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
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            About Stockwise
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We're building business management software that's powerful enough for growing companies yet simple enough to start using today.
                        </p>
                    </div>

                    {/* Why We Built Stockwise */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Why Stockwise Was Built</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            Small and medium enterprises face a difficult choice when selecting business management software. Enterprise ERP systems offer comprehensive features but come with overwhelming complexity, lengthy implementation times, and costs that are prohibitive for most growing businesses.
                        </p>
                        <p className="text-foreground leading-relaxed mb-4">
                            On the other hand, spreadsheets and basic tools are affordable and familiar, but they quickly become inadequate as businesses grow. Manual data entry leads to errors, reconciliation becomes time-consuming, and scaling operations becomes increasingly difficult.
                        </p>
                        <p className="text-foreground leading-relaxed">
                            Stockwise was created to bridge this gap. We focus on delivering the essential features that SMEs actually need – inventory management, sales and purchase tracking, and integrated accounting – in a package that's intuitive, affordable, and ready to use from day one.
                        </p>
                    </section>

                    {/* Our Vision */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Our Vision</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <Shield className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Reliable</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Build software that businesses can depend on every day. Your data is secure, backed up, and always accessible when you need it.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Zap className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Scalable</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Grow with your business. Start small and scale up as your operations expand, without switching systems or migrating data.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <Target className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Easy-to-Use</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Create software that doesn't require extensive training. Intuitive interfaces that your team can start using immediately.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* What We Focus On */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">What We Focus On</h2>
                        <div className="space-y-6">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Performance</h3>
                                <p className="text-muted-foreground">
                                    Fast, responsive software that doesn't slow you down. We optimize every feature to ensure quick load times and smooth interactions, even with large datasets.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Security</h3>
                                <p className="text-muted-foreground">
                                    Your business data is precious. We implement industry-standard encryption, regular backups, and strict access controls to keep your information safe and private.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Usability</h3>
                                <p className="text-muted-foreground">
                                    Clean, intuitive interfaces designed for real-world business workflows. We continuously refine our user experience based on feedback from actual users.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Integration</h3>
                                <p className="text-muted-foreground">
                                    Seamless connection between inventory and accounting. When one part of your business changes, everything else updates automatically, eliminating duplicate work.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Who Uses Stockwise */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Who Uses Stockwise</h2>
                        <div className="bg-muted/30 rounded-lg p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <Users className="h-10 w-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-3">Small Businesses</h3>
                                    <p className="text-muted-foreground">
                                        Businesses outgrowing spreadsheets and needing professional inventory and accounting tools without the complexity of enterprise systems.
                                    </p>
                                </div>
                                <div>
                                    <Users className="h-10 w-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-3">Growing Startups</h3>
                                    <p className="text-muted-foreground">
                                        Fast-growing companies that need scalable systems to support expansion while maintaining operational efficiency.
                                    </p>
                                </div>
                                <div>
                                    <Users className="h-10 w-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-3">Retail & Wholesale</h3>
                                    <p className="text-muted-foreground">
                                        Retailers and wholesalers managing product inventory across multiple locations with integrated sales and purchase tracking.
                                    </p>
                                </div>
                                <div>
                                    <Users className="h-10 w-10 text-primary mb-4" />
                                    <h3 className="text-xl font-semibold mb-3">Account-Driven Teams</h3>
                                    <p className="text-muted-foreground">
                                        Teams that need accurate financial records synchronized with inventory movements for better business decision-making.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Try Stockwise Today</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Experience business management software built for growing companies. Start with our free plan and see the difference.
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

export default AboutPage
