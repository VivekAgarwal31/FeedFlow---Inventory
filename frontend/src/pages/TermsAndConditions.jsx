import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Terms & Conditions - Stockwise</title>
                <meta name="description" content="Terms and Conditions for using Stockwise inventory and accounting management platform. Read about user responsibilities, service terms, and legal agreements." />
                <link rel="canonical" href="https://stock-wise.in/terms-and-conditions" />
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
                    <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
                    <p className="text-muted-foreground mb-8">Last updated: December 29, 2025</p>

                    <section className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                            <p className="text-foreground leading-relaxed">
                                Welcome to Stockwise. By accessing or using our cloud-based inventory, sales, purchase, and accounting management platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Service.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                These Terms constitute a legally binding agreement between you (either an individual or entity) and Stockwise. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                            <p className="text-foreground leading-relaxed">
                                Stockwise provides a cloud-based software-as-a-service (SaaS) platform for inventory management, sales tracking, purchase order management, delivery management, and integrated accounting features. Our Service includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Multi-warehouse inventory tracking and management</li>
                                <li>Sales and purchase order processing</li>
                                <li>Delivery in/out management</li>
                                <li>Client and supplier relationship management</li>
                                <li>Accounting features including receivables, payables, and cashbook</li>
                                <li>Reports and business analytics</li>
                                <li>User and staff management</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Eligibility and Account Registration</h2>
                            <p className="text-foreground leading-relaxed">
                                To use Stockwise, you must:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Be at least 18 years of age</li>
                                <li>Have the legal capacity to enter into binding contracts</li>
                                <li>Provide accurate, current, and complete information during registration</li>
                                <li>Maintain and promptly update your account information</li>
                                <li>Not use the Service for any illegal or unauthorized purpose</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Responsibilities</h2>
                            <p className="text-foreground leading-relaxed">
                                As a user of Stockwise, you agree to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Use the Service in compliance with all applicable laws and regulations</li>
                                <li>Maintain the security of your account and password</li>
                                <li>Notify us immediately of any unauthorized access or security breach</li>
                                <li>Be responsible for all data you input into the system</li>
                                <li>Ensure that your use of the Service does not violate any third-party rights</li>
                                <li>Not attempt to gain unauthorized access to any part of the Service</li>
                                <li>Not interfere with or disrupt the Service or servers</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Subscription and Pricing</h2>
                            <p className="text-foreground leading-relaxed">
                                Stockwise offers various subscription plans, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li><strong>Free Plan:</strong> Limited features for small businesses getting started</li>
                                <li><strong>Paid Plans:</strong> Enhanced features and capabilities (pricing available on our website)</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                Subscription fees are billed in advance on a monthly or annual basis, depending on your selected plan. All fees are non-refundable except as required by law or as explicitly stated in our Refund Policy.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                We reserve the right to modify our pricing at any time. Price changes will be communicated to you in advance and will take effect at the start of your next billing cycle.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Free Trial and Plan Changes</h2>
                            <p className="text-foreground leading-relaxed">
                                We may offer free trials for certain subscription plans. Free trials are subject to the following:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Trial periods are for new users only and limited to one per user/company</li>
                                <li>No payment information is required for free plan usage</li>
                                <li>You may cancel at any time during the trial period</li>
                                <li>Trial features may differ from paid plan features</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                You may upgrade, downgrade, or cancel your subscription at any time through your account settings. Changes will take effect at the start of your next billing cycle.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Prohibited Activities</h2>
                            <p className="text-foreground leading-relaxed">
                                You agree not to engage in any of the following prohibited activities:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Copying, modifying, or distributing the Service or its content</li>
                                <li>Reverse engineering or attempting to extract source code</li>
                                <li>Using the Service to transmit viruses, malware, or harmful code</li>
                                <li>Attempting to bypass security measures or access restrictions</li>
                                <li>Using automated systems (bots, scrapers) without authorization</li>
                                <li>Reselling or sublicensing the Service without permission</li>
                                <li>Using the Service for fraudulent or illegal activities</li>
                                <li>Harassing, threatening, or impersonating others</li>
                                <li>Violating any applicable laws or regulations</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Intellectual Property Rights</h2>
                            <p className="text-foreground leading-relaxed">
                                The Service, including its original content, features, and functionality, is owned by Stockwise and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                You retain all rights to the data you input into the Service. By using the Service, you grant us a limited license to use, store, and process your data solely for the purpose of providing the Service to you.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                Our trademarks, logos, and service marks may not be used without our prior written consent.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Service Availability and Limitations</h2>
                            <p className="text-foreground leading-relaxed">
                                While we strive to provide reliable and uninterrupted service, we do not guarantee that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>The Service will be available at all times or without interruption</li>
                                <li>The Service will be error-free or completely secure</li>
                                <li>Any defects or errors will be corrected immediately</li>
                                <li>The Service will meet all your specific requirements</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts of the Service.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Data Backup and Loss</h2>
                            <p className="text-foreground leading-relaxed">
                                While we implement regular backup procedures, you are responsible for maintaining your own backup copies of your data. We are not liable for any data loss, corruption, or destruction that may occur.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                We strongly recommend that you regularly export and backup your critical business data.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Termination</h2>
                            <p className="text-foreground leading-relaxed">
                                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Breach of these Terms</li>
                                <li>Non-payment of fees</li>
                                <li>Fraudulent or illegal activity</li>
                                <li>Violation of applicable laws</li>
                                <li>Prolonged inactivity</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                You may terminate your account at any time by contacting us or through your account settings. Upon termination, your right to use the Service will immediately cease, and we may delete your data after a reasonable grace period.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Limitation of Liability</h2>
                            <p className="text-foreground leading-relaxed">
                                To the maximum extent permitted by law, Stockwise and its affiliates, officers, employees, and agents shall not be liable for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                                <li>Loss of profits, revenue, data, or business opportunities</li>
                                <li>Service interruptions or data loss</li>
                                <li>Errors or inaccuracies in the Service</li>
                                <li>Unauthorized access to your data</li>
                            </ul>
                            <p className="text-foreground leading-relaxed mt-4">
                                Our total liability to you for any claims arising from your use of the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Indemnification</h2>
                            <p className="text-foreground leading-relaxed">
                                You agree to indemnify, defend, and hold harmless Stockwise and its affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-foreground">
                                <li>Your use of the Service</li>
                                <li>Your violation of these Terms</li>
                                <li>Your violation of any third-party rights</li>
                                <li>Your data or content</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Governing Law and Dispute Resolution</h2>
                            <p className="text-foreground leading-relaxed">
                                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                Any disputes arising from these Terms or your use of the Service shall be resolved through good faith negotiations. If negotiations fail, disputes shall be subject to the exclusive jurisdiction of the courts in India.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">15. Changes to Terms</h2>
                            <p className="text-foreground leading-relaxed">
                                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date.
                            </p>
                            <p className="text-foreground leading-relaxed mt-4">
                                Your continued use of the Service after changes become effective constitutes your acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Service.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">16. Severability</h2>
                            <p className="text-foreground leading-relaxed">
                                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">17. Entire Agreement</h2>
                            <p className="text-foreground leading-relaxed">
                                These Terms, together with our Privacy Policy and any other legal notices published by us, constitute the entire agreement between you and Stockwise concerning the Service.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mt-8 mb-4">18. Contact Information</h2>
                            <p className="text-foreground leading-relaxed">
                                If you have any questions about these Terms, please contact us:
                            </p>
                            <div className="mt-4 p-4 bg-muted rounded-lg">
                                <p className="text-foreground"><strong>Email:</strong> <a href="mailto:support@stock-wise.in" className="text-primary hover:underline">support@stock-wise.in</a></p>
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

export default TermsAndConditions
