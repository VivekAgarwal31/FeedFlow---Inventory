// Pricing plans configuration for Stockwise
// This configuration is designed for future subscription integration

export const pricingPlans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 0,
        priceLabel: 'Free',
        description: 'Perfect for small businesses getting started',
        features: [
            'Up to 2 warehouses',
            'Up to 100 stock items',
            'Basic inventory tracking',
            'Sales & purchase management',
            'Basic reports',
            'Email support'
        ],
        highlighted: false,
        ctaText: 'Get Started Free',
        ctaVariant: 'outline'
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 999,
        priceLabel: '₹999/month',
        description: 'For growing businesses with advanced needs',
        features: [
            'Unlimited warehouses',
            'Unlimited stock items',
            'Advanced inventory tracking',
            'Sales & purchase orders',
            'Delivery management',
            'Full accounting features',
            'Advanced reports & analytics',
            'Priority email support',
            'Multi-user access'
        ],
        highlighted: true,
        ctaText: 'Start Free Trial',
        ctaVariant: 'default'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: null,
        priceLabel: 'Custom',
        description: 'Custom solutions for large organizations',
        features: [
            'Everything in Professional',
            'Custom integrations',
            'Dedicated account manager',
            'Custom training',
            'SLA guarantee',
            '24/7 phone support',
            'Custom features',
            'On-premise deployment option'
        ],
        highlighted: false,
        ctaText: 'Contact Sales',
        ctaVariant: 'outline'
    }
]

export const getPlanById = (id) => {
    return pricingPlans.find(plan => plan.id === id)
}

export const getDefaultPlan = () => {
    return pricingPlans[0] // Starter plan
}
