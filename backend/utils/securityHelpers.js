// SECURITY HARDENING: Error sanitization utility
// Prevents information disclosure through error messages

/**
 * Sanitize error for client response
 * Removes stack traces and internal details in production
 * 
 * @param {Error} error - The error object
 * @param {string} userMessage - User-friendly message to show
 * @returns {object} Sanitized error response
 */
export function sanitizeError(error, userMessage = 'An error occurred') {
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, only return generic message
    if (isProduction) {
        return {
            message: userMessage,
            // Don't expose error details in production
        };
    }

    // In development, include more details for debugging
    return {
        message: userMessage,
        error: error.message,
        // Stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
}

/**
 * Sanitize authentication error
 * Returns generic message to prevent user enumeration
 * 
 * @param {string} errorType - Type of auth error
 * @returns {string} Generic error message
 */
export function sanitizeAuthError(errorType) {
    // Always return generic message to prevent user enumeration
    // Don't reveal whether user exists or password is wrong
    return 'Invalid credentials';
}

/**
 * Validate and sanitize numeric input for financial fields
 * 
 * @param {number} amount - Amount to validate
 * @param {string} fieldName - Name of the field for error messages
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, error: string|null, sanitized: number|null }
 */
export function validateAmount(amount, fieldName = 'Amount', options = {}) {
    const {
        min = 0,
        max = 10000000, // 1 crore default max
        allowZero = false,
        required = true
    } = options;

    // Check if required
    if (required && (amount === undefined || amount === null)) {
        return {
            valid: false,
            error: `${fieldName} is required`,
            sanitized: null
        };
    }

    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Check if valid number
    if (isNaN(numAmount) || !isFinite(numAmount)) {
        return {
            valid: false,
            error: `${fieldName} must be a valid number`,
            sanitized: null
        };
    }

    // Check if zero is allowed
    if (!allowZero && numAmount === 0) {
        return {
            valid: false,
            error: `${fieldName} must be greater than zero`,
            sanitized: null
        };
    }

    // Check minimum
    if (numAmount < min) {
        return {
            valid: false,
            error: `${fieldName} must be at least ₹${min}`,
            sanitized: null
        };
    }

    // Check maximum
    if (numAmount > max) {
        return {
            valid: false,
            error: `${fieldName} cannot exceed ₹${max}`,
            sanitized: null
        };
    }

    // Round to 2 decimal places
    const sanitized = Math.round(numAmount * 100) / 100;

    return {
        valid: true,
        error: null,
        sanitized
    };
}

/**
 * Validate payment method enum
 * 
 * @param {string} method - Payment method to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export function validatePaymentMethod(method) {
    const validMethods = ['cash', 'card', 'upi', 'bank_transfer', 'cheque'];

    if (!method) {
        return { valid: true, error: null }; // Optional field
    }

    if (!validMethods.includes(method)) {
        return {
            valid: false,
            error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
        };
    }

    return { valid: true, error: null };
}
