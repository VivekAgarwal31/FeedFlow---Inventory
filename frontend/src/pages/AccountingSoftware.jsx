import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowRight, DollarSign, FileText, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const AccountingSoftware = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Simple Accounting Software for Growing Businesses | Stockwise</title>
                <meta name="description" content="Integrated accounting software for SMEs. Manage receivables, payables, cashbook, and financial reports. Seamlessly connected with inventory management." />
                <meta name="keywords" content="accounting software, small business accounting, accounts receivable, accounts payable, cashbook software, financial reporting, SME accounting" />
                <link rel="canonical" href="https://bhagro.site/features/accounting-software" />
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
                        <span className="text-foreground">Accounting Software</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Simple Accounting Software for Growing Businesses
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                            Small and medium enterprises often struggle with fragmented accounting tools, manual data entry, and reconciliation errors. Using separate systems for inventory and accounting creates double work and increases the risk of mistakes. Stockwise provides integrated accounting software that works seamlessly with your inventory, eliminating duplicate entries and ensuring your financial records are always accurate and up-to-date.
                        </p>
                    </div>

                    {/* Accounting Inside Stockwise */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Accounting Inside Stockwise</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise includes comprehensive accounting features designed specifically for businesses that manage inventory. Our accounting module follows standard double-entry principles while remaining simple enough for non-accountants to use effectively.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <DollarSign className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Accounts Receivable & Payable</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Track money owed to you by clients and money you owe to suppliers. View outstanding balances, payment history, and aging reports at a glance.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Client-wise receivable tracking</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Supplier-wise payable management</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Payment recording and reconciliation</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <FileText className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Cashbook Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Maintain accurate cash records with our digital cashbook. Record all cash transactions, track daily balances, and reconcile with bank statements.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Cash in/out recording</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Daily balance tracking</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Transaction categorization</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <TrendingUp className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Entries Register</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Complete ledger system with double-entry accounting. Every transaction is automatically recorded with proper debits and credits.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Double-entry bookkeeping</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Automatic journal entries</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Complete audit trail</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <BarChart3 className="h-10 w-10 text-primary mb-3" />
                                    <CardTitle>Financial Reports</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        Generate comprehensive financial reports instantly. Export to PDF or Excel for sharing with stakeholders or accountants.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Sales and purchase reports</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Profit and loss statements</span>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" />
                                            <span>Balance sheet generation</span>
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    {/* Integration */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Inventory and Accounting Working Together</h2>
                        <p className="text-foreground leading-relaxed mb-4">
                            The real power of Stockwise comes from the seamless integration between <Link to="/features/inventory-management" className="text-primary hover:underline">inventory management</Link> and accounting. When you create a sale or purchase, Stockwise automatically:
                        </p>
                        <div className="bg-muted/30 rounded-lg p-6 mb-6">
                            <ul className="space-y-3">
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Updates inventory levels</strong> – Stock quantities adjust in real-time</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Creates accounting entries</strong> – Proper debits and credits are recorded automatically</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Updates receivables/payables</strong> – Client and supplier balances reflect immediately</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5 mr-3 flex-shrink-0" />
                                    <span className="text-foreground"><strong>Maintains data consistency</strong> – No manual reconciliation needed</span>
                                </li>
                            </ul>
                        </div>
                        <p className="text-foreground leading-relaxed">
                            This integration eliminates the need to enter the same transaction in multiple places, reducing errors and saving hours of manual work each week.
                        </p>
                    </section>

                    {/* Benefits */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Benefits of Using Stockwise for Accounting</h2>
                        <div className="space-y-6">
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Reduced Errors</h3>
                                <p className="text-muted-foreground">
                                    Automatic accounting entries eliminate manual data entry errors. When inventory moves, accounting records update automatically, ensuring perfect synchronization between stock and finances.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Faster Reporting</h3>
                                <p className="text-muted-foreground">
                                    Generate financial reports in seconds instead of hours. All data is already organized and categorized, making report creation instant and accurate.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Better Financial Clarity</h3>
                                <p className="text-muted-foreground">
                                    See your complete financial picture at a glance. Know exactly who owes you money, what you owe suppliers, and your current cash position – all in real-time.
                                </p>
                            </div>
                            <div className="border-l-4 border-primary pl-6">
                                <h3 className="text-xl font-semibold mb-2">Time Savings</h3>
                                <p className="text-muted-foreground">
                                    Spend less time on bookkeeping and more time growing your business. Automated processes reduce accounting work by up to 70%.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Comparison */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-semibold mb-6">Stockwise vs Traditional Accounting Tools</h2>
                        <p className="text-foreground leading-relaxed mb-6">
                            Stockwise occupies the sweet spot between complex enterprise ERP systems and basic spreadsheets:
                        </p>
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-lg">Spreadsheets</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <p>✗ Manual data entry</p>
                                    <p>✗ Error-prone</p>
                                    <p>✗ No automation</p>
                                    <p>✗ Limited reporting</p>
                                    <p>✗ No integration</p>
                                </CardContent>
                            </Card>

                            <Card className="border-primary shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-lg text-primary">Stockwise</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <p className="text-success">✓ Automatic entries</p>
                                    <p className="text-success">✓ Error-free</p>
                                    <p className="text-success">✓ Fully automated</p>
                                    <p className="text-success">✓ Instant reports</p>
                                    <p className="text-success">✓ Inventory integrated</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-lg">Enterprise ERP</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm text-muted-foreground">
                                    <p>✗ Complex setup</p>
                                    <p>✗ Expensive</p>
                                    <p>✗ Steep learning curve</p>
                                    <p>✗ Overkill for SMEs</p>
                                    <p>✗ Long implementation</p>
                                </CardContent>
                            </Card>
                        </div>
                        <p className="text-foreground leading-relaxed mt-6">
                            Stockwise provides professional accounting capabilities without the complexity or cost of enterprise systems. It's powerful enough for growing businesses yet simple enough to start using immediately.
                        </p>
                    </section>

                    {/* CTA Section */}
                    <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-lg p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Start Using Stockwise for Accounting</h2>
                        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                            Experience integrated inventory and accounting management. See our <Link to="/pricing" className="text-primary hover:underline">pricing plans</Link> and start your free trial today.
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

export default AccountingSoftware
