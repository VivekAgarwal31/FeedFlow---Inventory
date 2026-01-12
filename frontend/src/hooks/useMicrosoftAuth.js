import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Microsoft OAuth Configuration
const MICROSOFT_CLIENT_ID = '27c1fb88-3c64-4e06-8643-729e8c39f904';
const MICROSOFT_TENANT_ID = 'cd7c9781-b355-46fe-9317-db152f14bf06';
const MICROSOFT_REDIRECT_URI = window.location.origin + '/auth/microsoft/callback';
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';

export const useMicrosoftAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setAuthData } = useAuth();
    const navigate = useNavigate();

    /**
     * Generate Microsoft OAuth authorization URL
     */
    const getMicrosoftAuthUrl = useCallback(() => {
        const params = new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            response_type: 'code',
            redirect_uri: MICROSOFT_REDIRECT_URI,
            response_mode: 'query',
            scope: 'openid profile email User.Read',
            tenant: MICROSOFT_TENANT_ID,
            prompt: 'select_account'
        });

        return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
    }, []);

    /**
     * Handle Microsoft OAuth callback
     */
    const handleMicrosoftCallback = useCallback(async (code) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Microsoft callback with code:', code);

            // Send authorization code to backend
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/microsoft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Microsoft authentication failed');
            }

            console.log('Microsoft auth success:', data);

            // Set auth data directly
            setAuthData(data.token, data.user);

            // Navigate based on onboarding status
            if (!data.user.companyId || !data.user.companyId.onboardingCompleted) {
                navigate('/company-setup');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Microsoft auth error:', err);
            setError(err.message || 'Failed to authenticate with Microsoft');
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setAuthData]);

    /**
     * Initiate Microsoft login flow
     */
    const loginWithMicrosoft = useCallback(() => {
        setError(null);
        const authUrl = getMicrosoftAuthUrl();

        // Open Microsoft login in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            authUrl,
            'Microsoft Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for postMessage from callback page
        const handleMessage = (event) => {
            // Verify origin for security
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
                window.removeEventListener('message', handleMessage);
                handleMicrosoftCallback(event.data.code);
            } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
                window.removeEventListener('message', handleMessage);
                setError('Microsoft authentication failed');
            }
        };

        window.addEventListener('message', handleMessage);

        // Cleanup if popup is closed without completing auth
        const checkClosed = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', handleMessage);
            }
        }, 1000);
    }, [getMicrosoftAuthUrl, handleMicrosoftCallback]);

    return {
        isLoading,
        error,
        loginWithMicrosoft,
        handleMicrosoftCallback
    };
};
