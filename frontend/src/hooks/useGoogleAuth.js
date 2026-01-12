import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = '475629048114-hd4q6olqdh7cm6j34m4l39vgu7t4bee4.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = window.location.origin + '/auth/google/callback';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export const useGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setAuthData } = useAuth();
    const navigate = useNavigate();

    /**
     * Generate Google OAuth authorization URL
     */
    const getGoogleAuthUrl = useCallback(() => {
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'token',
            scope: 'openid profile email',
            prompt: 'select_account'
        });

        return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    }, []);

    /**
     * Handle Google OAuth callback with token
     */
    const handleGoogleCallback = useCallback(async (token) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Google token received');

            // Send token to backend
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Google authentication failed');
            }

            console.log('Google auth success:', data);

            // Set auth data directly
            setAuthData(data.token, data.user);

            // Navigate based on onboarding status
            if (!data.user.companyId || !data.user.companyId.onboardingCompleted) {
                navigate('/company-setup');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Google auth error:', err);
            setError(err.message || 'Failed to authenticate with Google');
        } finally {
            setIsLoading(false);
        }
    }, [navigate, setAuthData]);

    /**
     * Initiate Google login flow with popup
     */
    const loginWithGoogle = useCallback(() => {
        setError(null);
        const authUrl = getGoogleAuthUrl();

        // Open Google login in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            authUrl,
            'Google Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for callback
        const checkPopup = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(checkPopup);
                return;
            }

            try {
                // Check if popup has navigated to our callback URL
                if (popup.location.href.includes(GOOGLE_REDIRECT_URI)) {
                    // Extract token from URL hash
                    const hash = popup.location.hash;
                    const params = new URLSearchParams(hash.substring(1));
                    const token = params.get('access_token');
                    const errorParam = params.get('error');

                    popup.close();
                    clearInterval(checkPopup);

                    if (errorParam) {
                        setError('Google authentication was cancelled or failed');
                    } else if (token) {
                        handleGoogleCallback(token);
                    }
                }
            } catch (e) {
                // Cross-origin error - popup is still on Google's domain
                // This is expected, just continue checking
            }
        }, 500);
    }, [getGoogleAuthUrl, handleGoogleCallback]);

    return {
        isLoading,
        error,
        loginWithGoogle
    };
};
