export default {
    // Resend sender configuration
    sender: {
        name: 'Stockwise Security',
        email: 'no-reply@stock-wise.in'
    },

    // Reply-to address
    replyTo: 'support@stock-wise.in',

    // Domain configuration
    domain: 'stock-wise.in',

    // OTP configuration
    otp: {
        expiryMinutes: 10,
        length: 6,
        rateLimit: {
            maxAttempts: 3,
            windowMinutes: 10
        }
    },

    // Brand colors
    colors: {
        primary: '#21263c',
        accent: '#5B6CFF',
        background: '#F8FAFC',
        warning: '#F59E0B',
        text: '#1F2937',
        textLight: '#6B7280',
        border: '#E5E7EB'
    },

    // Typography
    fonts: {
        family: 'Inter, Roboto, Arial, sans-serif',
        otpFamily: 'Monaco, Consolas, monospace'
    }
};
