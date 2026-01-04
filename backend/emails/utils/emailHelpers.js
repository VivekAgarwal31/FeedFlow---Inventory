/**
 * Mask email address for privacy
 * Example: user@example.com => u***@example.com
 */
function maskEmail(email) {
    if (!email || typeof email !== 'string') return 'unknown';

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;

    const maskedLocal = localPart.length > 2
        ? localPart[0] + '***' + localPart[localPart.length - 1]
        : localPart[0] + '***';

    return `${maskedLocal}@${domain}`;
}

/**
 * Get device information from request
 */
function getDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || '';

    // Extract browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Extract device/OS
    let device = 'Unknown';
    if (userAgent.includes('Windows')) device = 'Windows';
    else if (userAgent.includes('Mac')) device = 'macOS';
    else if (userAgent.includes('Linux')) device = 'Linux';
    else if (userAgent.includes('Android')) device = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) device = 'iOS';

    return {
        browser,
        device,
        userAgent
    };
}

/**
 * Get IP address from request
 */
function getIpAddress(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        'Unknown';
}

/**
 * Format timestamp for email
 */
function formatTimestamp(date = new Date()) {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Replace template variables in string
 */
function replaceTemplateVars(template, variables) {
    let result = template;

    // First, handle conditional blocks {{#if VAR}}...{{/if}}
    // This regex finds the entire conditional block
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
        // If the variable exists and is truthy, return the content, otherwise empty string
        if (variables[varName]) {
            // Process the content to replace any variables inside it
            let processedContent = content;
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                processedContent = processedContent.replace(regex, variables[key] || '');
            });
            return processedContent;
        }
        return '';
    });

    // Then replace simple variables {{VAR}}
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, variables[key] || '');
    });

    return result;
}

/**
 * Generate OTP code
 */
function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

export {
    maskEmail,
    getDeviceInfo,
    getIpAddress,
    formatTimestamp,
    replaceTemplateVars,
    generateOTP
};
