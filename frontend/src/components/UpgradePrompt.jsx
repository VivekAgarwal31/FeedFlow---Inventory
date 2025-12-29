import React from 'react';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

const UpgradePrompt = ({
    message,
    feature,
    onUpgrade,
    onClose,
    variant = 'banner' // 'banner', 'modal', 'inline'
}) => {
    if (variant === 'banner') {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                {feature ? `Upgrade to Access ${feature}` : 'Upgrade Your Plan'}
                            </h4>
                            <p className="text-sm text-gray-700">
                                {message || 'This feature is not available on your current plan.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {onUpgrade && (
                            <button
                                onClick={onUpgrade}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Upgrade Now
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-gray-700">{message}</span>
                {onUpgrade && (
                    <button
                        onClick={onUpgrade}
                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                        Upgrade
                    </button>
                )}
            </div>
        );
    }

    // Modal variant
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {feature ? `Upgrade to Access ${feature}` : 'Upgrade Required'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {message || 'This feature is not available on your current plan. Upgrade to unlock full access.'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Maybe Later
                        </button>
                    )}
                    {onUpgrade && (
                        <button
                            onClick={onUpgrade}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center gap-2"
                        >
                            Upgrade Now
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt;
