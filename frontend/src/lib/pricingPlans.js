// Pricing plans configuration for Stockwise
// Updated to reflect Free, Trial, and Paid plan structure

export const pricingPlans = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        priceLabel: 'Free Forever',
        description: 'Perfect for small businesses getting started',
        features: [
            'Up to 2 warehouses',
            'Up to 5 stock items',
            'Basic inventory tracking',
            'Sales & purchase management',
            'Email support'
        ],
        limitations: [
            'No backup functionality',
            'No advanced reports',
            'No accounting module'
        ],
        highlighted: false,
        ctaText: 'Get Started Free',
        ctaVariant: 'outline'
    },
    {
        id: 'trial',
        name: '14-Day Trial',
        price: 0,
        priceLabel: 'Free for 14 Days',
        description: 'Try all features risk-free',
        features: [
            'Unlimited warehouses',
            'Unlimited stock items',
            'Advanced inventory tracking',
            'Sales & purchase orders',
            'Delivery management',
            'Full accounting features',
            'Advanced reports & analytics',
            'Backup & restore',
            'Priority support'
        ],
        trialInfo: 'Automatically downgrades to Free plan after 14 days',
        highlighted: true,
        ctaText: 'Start Free Trial',
        ctaVariant: 'default'
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 2499,
        priceLabel: '₹2,499',
        description: 'One-time payment for lifetime access',
        features: [
            'Unlimited warehouses',
            'Unlimited stock items',
            'Advanced inventory tracking',
            'Sales & purchase orders',
            'Delivery management',
            'Full accounting features',
            'Advanced reports & analytics',
            'Backup & restore',
            'Priority email support',
            'Multi-user access',
            'Lifetime access - pay once, use forever'
        ],
        highlighted: true,
        ctaText: 'Upgrade Now',
        ctaVariant: 'default'
    }
]

export const getPlanById = (id) => {
    return pricingPlans.find(plan => plan.id === id)
}

export const getDefaultPlan = () => {
    return pricingPlans[0] // Free plan
}
