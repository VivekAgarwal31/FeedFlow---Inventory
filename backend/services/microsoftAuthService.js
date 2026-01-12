import axios from 'axios';

// Microsoft OAuth Configuration
const MICROSOFT_CLIENT_ID = '27c1fb88-3c64-4e06-8643-729e8c39f904';
const MICROSOFT_TENANT_ID = 'cd7c9781-b355-46fe-9317-db152f14bf06';
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || 'https://stock-wise.in/auth/microsoft/callback';

// Microsoft OAuth URLs
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MICROSOFT_USERINFO_URL = 'https://graph.microsoft.com/v1.0/me';

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from Microsoft
 * @returns {Promise<string>} Access token
 */
export const exchangeCodeForToken = async (code) => {
    try {
        const params = new URLSearchParams({
            client_id: MICROSOFT_CLIENT_ID,
            client_secret: MICROSOFT_CLIENT_SECRET,
            code: code,
            redirect_uri: MICROSOFT_REDIRECT_URI,
            grant_type: 'authorization_code',
            scope: 'openid profile email User.Read'
        });

        const response = await axios.post(MICROSOFT_TOKEN_URL, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Microsoft token exchange error:', error.response?.data || error.message);
        throw new Error('Failed to exchange authorization code for token');
    }
};

/**
 * Verify Microsoft access token and get user info
 * @param {string} accessToken - Microsoft access token
 * @returns {Promise<Object>} User information
 */
export const verifyMicrosoftToken = async (accessToken) => {
    try {
        const response = await axios.get(MICROSOFT_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Microsoft token verification error:', error.response?.data || error.message);
        throw new Error('Invalid Microsoft access token');
    }
};

/**
 * Extract user information from Microsoft user data
 * @param {Object} microsoftUser - User data from Microsoft Graph API
 * @returns {Object} Extracted user information
 */
export const extractUserInfo = (microsoftUser) => {
    return {
        microsoftId: microsoftUser.id,
        email: microsoftUser.mail || microsoftUser.userPrincipalName,
        fullName: microsoftUser.displayName,
        profilePicture: null, // Microsoft Graph doesn't provide profile picture URL directly
        emailVerified: true // Microsoft emails are verified
    };
};

/**
 * Get Microsoft OAuth authorization URL
 * @returns {string} Authorization URL
 */
export const getMicrosoftAuthUrl = () => {
    const params = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        response_type: 'code',
        redirect_uri: MICROSOFT_REDIRECT_URI,
        response_mode: 'query',
        scope: 'openid profile email User.Read',
        tenant: MICROSOFT_TENANT_ID
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};
