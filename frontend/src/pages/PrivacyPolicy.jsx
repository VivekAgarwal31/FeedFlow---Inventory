import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Privacy Policy - Stockwise</title>
                <meta name="description" content="Privacy Policy for Stockwise - Learn how we collect, use, and protect your data in our inventory and accounting management platform." />
                <link rel="canonical" href="https://bhagro.site/privacy-policy" />
            </Helmet>

            {/* Header */}
            <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center">
                            <img
                                src="/stockwise black.webp"
                                alt="Stockwise Logo"
                                width="150"
                                height="40"
                                className="h-10 w-auto"
                            />
                        </Link>
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <article className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: December 29, 2025</p>

                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
                            <p className="text-foreground leading-relaxed">
                                Welcome to Stockwise. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cloud-based inventory, sales, purchase, and accounting management platform.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                By using Stockwise, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>
                            <p className="text-foreground leading-relaxed">
                                When you create an account with Stockwise, we collect:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Full name</li>
                                <li>Email address</li>
                                <li>Phone number (optional)</li>
                                <li>Company name and details</li>
                                <li>Password (encrypted)</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Usage Data</h3>
                            <p className="text-foreground leading-relaxed">
                                We automatically collect certain information when you use our platform:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>IP address and device information</li>
                                <li>Browser type and version</li>
                                <li>Pages visited and features used</li>
                                <li>Time and date of access</li>
                                <li>Usage patterns and preferences</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Business Data</h3>
                            <p className="text-foreground leading-relaxed">
                                As part of our service, you may input business-related information including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Inventory and stock data</li>
                                <li>Sales and purchase records</li>
                                <li>Client and supplier information</li>
                                <li>Financial and accounting data</li>
                            </ul>

                            <h3 className="text-xl font-semibold mt-6 mb-3">Cookies and Tracking</h3>
                            <p className="text-foreground leading-relaxed">
                                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
                            <p className="text-foreground leading-relaxed">
                                We use the collected information for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li><strong>Service Provision:</strong> To provide, maintain, and improve our inventory and accounting management services</li>
                                <li><strong>Account Management:</strong> To create and manage your account, authenticate users, and provide customer support</li>
                                <li><strong>Communication:</strong> To send you service updates, security alerts, and administrative messages</li>
                                <li><strong>Product Improvement:</strong> To analyze usage patterns and improve our platform features and user experience</li>
                                <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
                                <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
                            <p className="text-foreground leading-relaxed">
                                We implement industry-standard security measures to protect your information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Secure authentication and password hashing</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and monitoring</li>
                                <li>Secure cloud infrastructure</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                While we strive to protect your personal information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to maintain the highest security standards.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Services</h2>
                            <p className="text-foreground leading-relaxed">
                                We may use third-party service providers to help us operate our platform:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li><strong>Cloud Hosting:</strong> For secure data storage and platform hosting</li>
                                <li><strong>Analytics:</strong> To understand usage patterns and improve our services</li>
                                <li><strong>Email Services:</strong> For sending transactional and service-related emails</li>
                                <li><strong>Payment Processors:</strong> For handling subscription payments (when applicable)</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                These third parties have access to your information only to perform specific tasks on our behalf and are obligated to protect your data in accordance with this Privacy Policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
                            <p className="text-foreground leading-relaxed">
                                You have the following rights regarding your personal information:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
                                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                                <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                To exercise these rights, please contact us at <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a>.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
                            <p className="text-foreground leading-relaxed">
                                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal, regulatory, or security purposes.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                Business data you create within the platform will be retained according to your subscription plan and data retention settings.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy</h2>
                            <p className="text-foreground leading-relaxed">
                                Stockwise is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">International Data Transfers</h2>
                            <p className="text-foreground leading-relaxed">
                                Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Privacy Policy</h2>
                            <p className="text-foreground leading-relaxed">
                                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                We encourage you to review this Privacy Policy periodically. Your continued use of Stockwise after any changes constitutes your acceptance of the updated policy.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
                            <p className="text-foreground leading-relaxed">
                                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="text-foreground"><strong>Email:</strong> <a href="mailto:support@bhagro.site" className="text-primary hover:underline">support@bhagro.site</a></p>
                                <p className="text-foreground mt-2"><strong>Service:</strong> Stockwise - Smart Inventory & Accounting Management</p>
                            </div>
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

export default PrivacyPolicy
