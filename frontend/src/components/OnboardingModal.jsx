import React, { useState } from 'react'
import { Package, FileBarChart, ArrowRight, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { companyAPI } from '../lib/api'
import { useToast } from '../hooks/use-toast'

const OnboardingModal = ({ open, onComplete }) => {
    const [selectedMode, setSelectedMode] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()

    const handleModeSelection = async (mode) => {
        setSubmitting(true)
        try {
            await companyAPI.update({
                deliveryMode: mode,
                onboardingCompleted: true
            })

            // Update local storage
            const user = JSON.parse(localStorage.getItem('user'))
            if (user && user.companyId) {
                user.companyId.deliveryMode = mode
                user.companyId.onboardingCompleted = true
                localStorage.setItem('user', JSON.stringify(user))
            }

            toast({
                title: 'Success!',
                description: `${mode === 'order_based' ? 'Order-Based' : 'Direct'} Delivery mode activated`
            })

            // Reload to update sidebar
            setTimeout(() => {
                window.location.reload()
            }, 500)
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save delivery mode',
                variant: 'destructive'
            })
            setSubmitting(false)
        }
    }

    const modes = [
        {
            id: 'order_based',
            title: 'Order-Based Delivery',
            icon: FileBarChart,
            color: 'blue',
            description: 'Create orders first, then fulfill them',
            bestFor: 'Businesses with pre-orders, delivery scheduling, B2B operations',
            workflow: 'Sales Order → Delivery Out | Purchase Order → Delivery In',
            features: [
                'Detailed order tracking',
                'Partial deliveries supported',
                'Order status management',
                'Perfect for scheduled deliveries'
            ]
        },
        {
            id: 'direct',
            title: 'Direct Delivery',
            icon: Package,
            color: 'green',
            description: 'Record sales and purchases instantly',
            bestFor: 'Retail stores, walk-in customers, immediate transactions',
            workflow: 'Direct Sales & Direct Purchases (no orders needed)',
            features: [
                'Immediate transactions',
                'Simple and fast',
                'Perfect for retail',
                'No order management needed'
            ]
        }
    ]

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-6xl max-h-[95vh] overflow-y-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="space-y-6 py-4">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                            Welcome to Stockwise! 🎉
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Choose your delivery workflow to get started
                        </p>
                    </div>

                    {/* Mode Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modes.map((mode) => {
                            const Icon = mode.icon
                            const isSelected = selectedMode === mode.id
                            const colorClasses = {
                                blue: 'border-blue-500 bg-blue-50 ring-blue-500',
                                green: 'border-green-500 bg-green-50 ring-green-500'
                            }
                            const iconColors = {
                                blue: 'text-blue-600',
                                green: 'text-green-600'
                            }

                            return (
                                <Card
                                    key={mode.id}
                                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                                            ? `border-2 ${colorClasses[mode.color]} ring-2`
                                            : 'border-2 border-transparent hover:border-gray-300'
                                        }`}
                                    onClick={() => setSelectedMode(mode.id)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-lg ${mode.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                                    <Icon className={`h-8 w-8 ${iconColors[mode.color]}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-xl">{mode.title}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {mode.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className={`p-1 rounded-full ${mode.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                                    <Check className="h-5 w-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Best For:</p>
                                            <p className="text-sm text-gray-600">{mode.bestFor}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Workflow:</p>
                                            <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                                {mode.workflow}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Key Features:</p>
                                            <ul className="space-y-1">
                                                {mode.features.map((feature, index) => (
                                                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                                                        <div className={`h-1.5 w-1.5 rounded-full ${mode.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'}`} />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button
                                            className={`w-full ${mode.color === 'blue'
                                                    ? 'bg-blue-600 hover:bg-blue-700'
                                                    : 'bg-green-600 hover:bg-green-700'
                                                }`}
                                            onClick={() => handleModeSelection(mode.id)}
                                            disabled={submitting}
                                        >
                                            {submitting && selectedMode === mode.id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                    Setting up...
                                                </>
                                            ) : (
                                                <>
                                                    Select {mode.title}
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-4 text-center">Quick Comparison</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-4">Feature</th>
                                        <th className="text-center py-2 px-4">Order-Based</th>
                                        <th className="text-center py-2 px-4">Direct</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 px-4 font-medium">Workflow</td>
                                        <td className="py-2 px-4 text-center">Orders → Delivery</td>
                                        <td className="py-2 px-4 text-center">Immediate</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 px-4 font-medium">Best For</td>
                                        <td className="py-2 px-4 text-center">Pre-orders, B2B</td>
                                        <td className="py-2 px-4 text-center">Retail, Walk-in</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 px-4 font-medium">Complexity</td>
                                        <td className="py-2 px-4 text-center">Detailed tracking</td>
                                        <td className="py-2 px-4 text-center">Simple & fast</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 px-4 font-medium">Reports</td>
                                        <td className="py-2 px-4 text-center">Order-based</td>
                                        <td className="py-2 px-4 text-center">Transaction-based</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            💡 Don't worry! You can change this later in Settings
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default OnboardingModal
