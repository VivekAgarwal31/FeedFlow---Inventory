import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MicrosoftCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        // If opened in popup, send message to parent window
        if (window.opener) {
            if (error) {
                window.opener.postMessage({ type: 'MICROSOFT_AUTH_ERROR', error }, window.location.origin);
            } else if (code) {
                window.opener.postMessage({ type: 'MICROSOFT_AUTH_SUCCESS', code }, window.location.origin);
            }
            window.close();
        } else {
            // If not in popup, redirect to home
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing authentication...</p>
            </div>
        </div>
    );
};

export default MicrosoftCallback;
