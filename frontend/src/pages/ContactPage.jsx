import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'
import { Mail, Send } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../hooks/use-toast'

const ContactPage = () => {
    const { toast } = useToast()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send message')
            }

            toast({
                title: 'Message Sent!',
                description: data.message || 'Thank you for contacting us. We\'ll get back to you soon.'
            })
            setFormData({ name: '', email: '', message: '' })
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to send message. Please try again.',
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>Contact Us - Stockwise Support</title>
                <meta name="description" content="Get in touch with Stockwise. Contact our support team for questions, feedback, or assistance with inventory and accounting software." />
                <link rel="canonical" href="https://stock-wise.in/contact" />
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

            {/* Content */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                            Contact Us
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Have a question or need assistance? We're here to help. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Send Us a Message</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you within 24-48 hours.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                            placeholder="Tell us how we can help..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? (
                                            <>Sending...</>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Support</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start space-x-3">
                                        <Mail className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="text-foreground font-medium mb-1">General Inquiries</p>
                                            <a href="mailto:support@stock-wise.in" className="text-primary hover:underline">
                                                support@stock-wise.in
                                            </a>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                We typically respond within 24-48 hours during business days.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Need Help?</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">
                                        Looking for answers to common questions? Visit our support page for helpful resources and guides.
                                    </p>
                                    <Link to="/support">
                                        <Button variant="outline" className="w-full">
                                            Visit Support Center
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle>Business Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Our support team is available Monday through Friday, 9:00 AM to 6:00 PM IST. Messages received outside business hours will be responded to on the next business day.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
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

export default ContactPage
