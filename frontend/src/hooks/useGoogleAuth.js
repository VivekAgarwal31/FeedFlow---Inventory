import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = '475629048114-hd4q6olqdh7cm6j34m4l39vgu7t4bee4.apps.googleusercontent.com';

export const useGoogleAuth = () => {
    const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { setAuthData } = useAuth();
    const navigate = useNavigate();

    // Initialize Google Identity Services
    useEffect(() => {
        // Check if Google script is loaded
        if (window.google?.accounts) {
            setIsGoogleLoaded(true);
            return;
        }

        // Wait for script to load
        const checkGoogle = setInterval(() => {
            if (window.google?.accounts) {
                setIsGoogleLoaded(true);
                clearInterval(checkGoogle);
            }
        }, 100);

        // Cleanup
        return () => clearInterval(checkGoogle);
    }, []);

    // Handle Google credential response
    const handleCredentialResponse = useCallback(async (response) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('Google credential response:', response);

            // Ensure we have a credential
            if (!response.credential) {
                throw new Error('No credential received from Google');
            }

            // Send token to backend
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: response.credential })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Google authentication failed');
            }

            console.log('Google auth success:', data);

            // Set auth data directly (no need for API call since backend already authenticated)
            setAuthData(data.token, data.user);

            // Navigate based on onboarding status
            // If user has no company or onboarding not completed, go to company setup
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
    }, [navigate]);

    // Initialize Google Sign-In button
    const initializeGoogleButton = useCallback((elementId) => {
        if (!isGoogleLoaded || !window.google?.accounts) {
            console.warn('Google Identity Services not loaded');
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Render button
            window.google.accounts.id.renderButton(
                document.getElementById(elementId),
                {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 250  // Fixed width to prevent layout shift
                }
            );
        } catch (err) {
            console.error('Failed to initialize Google button:', err);
            setError('Failed to load Google Sign-In');
        }
    }, [isGoogleLoaded, handleCredentialResponse]);

    // Initialize One Tap
    const initializeOneTap = useCallback(() => {
        if (!isGoogleLoaded || !window.google?.accounts) {
            return;
        }

        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false
            });

            // Display One Tap prompt
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('One Tap not displayed:', notification.getNotDisplayedReason());
                }
            });
        } catch (err) {
            console.error('Failed to initialize One Tap:', err);
        }
    }, [isGoogleLoaded, handleCredentialResponse]);

    return {
        isGoogleLoaded,
        isLoading,
        error,
        initializeGoogleButton,
        initializeOneTap
    };
};
