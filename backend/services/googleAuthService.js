import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and extract user information
 * @param {string} token - Google ID token from frontend
 * @returns {Promise<Object>} - Verified user payload
 */
export const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        // Validate required fields
        if (!payload || !payload.email) {
            throw new Error('Invalid token payload');
        }

        return payload;
    } catch (error) {
        console.error('Google token verification failed:', error.message);
        throw new Error('Invalid Google token');
    }
};

/**
 * Extract user information from Google payload
 * @param {Object} payload - Verified Google token payload
 * @returns {Object} - Extracted user info
 */
export const extractUserInfo = (payload) => {
    return {
        googleId: payload.sub,
        email: payload.email,
        fullName: payload.name || payload.email.split('@')[0],
        profilePicture: payload.picture || null,
        emailVerified: payload.email_verified || false
    };
};
