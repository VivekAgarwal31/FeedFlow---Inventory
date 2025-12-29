import React from 'react';
import { Crown, Zap, Gift } from 'lucide-react';

const PlanBadge = ({ planType, planName, className = '' }) => {
    const getBadgeConfig = () => {
        switch (planType) {
            case 'paid':
                return {
                    icon: Crown,
                    bgColor: 'bg-gradient-to-r from-yellow-500 to-amber-600',
                    textColor: 'text-white',
                    label: planName || 'Paid'
                };
            case 'trial':
                return {
                    icon: Zap,
                    bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
                    textColor: 'text-white',
                    label: planName || 'Trial'
                };
            case 'free':
            default:
                return {
                    icon: Gift,
                    bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    textColor: 'text-white',
                    label: planName || 'Free'
                };
        }
    };

    const config = getBadgeConfig();
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} text-sm font-semibold shadow-md ${className}`}>
            <Icon className="w-4 h-4" />
            <span>{config.label}</span>
        </div>
    );
};

export default PlanBadge;
