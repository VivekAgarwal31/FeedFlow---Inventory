import React from 'react';
import { Crown, Zap, Gift } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const PlanBadge = ({ planType, planName, trialEndsAt, className = '' }) => {
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

    const calculateRemainingDays = () => {
        if (!trialEndsAt) return null;
        const endDate = new Date(trialEndsAt);
        // Use start of today for accurate day counting
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const config = getBadgeConfig();
    const Icon = config.icon;
    const remainingDays = planType === 'trial' ? calculateRemainingDays() : null;

    const badge = (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} ${config.textColor} text-sm font-semibold shadow-md ${className}`}>
            <Icon className="w-4 h-4" />
            <span>{config.label}</span>
        </div>
    );

    // If it's a trial plan and we have remaining days info, wrap in tooltip
    if (planType === 'trial' && remainingDays !== null) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {badge}
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="font-medium">
                            {remainingDays > 0
                                ? `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
                                : remainingDays === 0
                                    ? 'Expires today'
                                    : 'Trial expired'
                            }
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return badge;
};

export default PlanBadge;
