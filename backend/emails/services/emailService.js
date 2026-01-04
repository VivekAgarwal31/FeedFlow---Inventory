import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import emailConfig from '../config/emailConfig.js';
import {
    maskEmail,
    getDeviceInfo,
    getIpAddress,
    formatTimestamp,
    replaceTemplateVars
} from '../utils/emailHelpers.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend lazily (after env vars are loaded)
let resend = null;
function getResend() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

// Rate limiting storage (in-memory, consider Redis for production)
const emailRateLimits = new Map();

/**
 * Check rate limit for email sending
 */
function checkRateLimit(email) {
    const now = Date.now();
    const key = email.toLowerCase();

    if (!emailRateLimits.has(key)) {
        emailRateLimits.set(key, []);
    }

    const attempts = emailRateLimits.get(key);

    // Remove attempts older than the window
    const windowMs = emailConfig.otp.rateLimit.windowMinutes * 60 * 1000;
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

    // Update the map
    emailRateLimits.set(key, recentAttempts);

    // Check if limit exceeded
    if (recentAttempts.length >= emailConfig.otp.rateLimit.maxAttempts) {
        const oldestAttempt = Math.min(...recentAttempts);
        const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000 / 60);
        return {
            allowed: false,
            waitMinutes: waitTime
        };
    }

    // Record this attempt
    recentAttempts.push(now);
    emailRateLimits.set(key, recentAttempts);

    return { allowed: true };
}

/**
 * Load email template
 */
async function loadTemplate(templateName) {
    const htmlPath = path.join(__dirname, '../templates', `${templateName}.html`);
    const textPath = path.join(__dirname, '../templates', `${templateName}.txt`);

    try {
        const [html, text] = await Promise.all([
            fs.readFile(htmlPath, 'utf-8'),
            fs.readFile(textPath, 'utf-8')
        ]);

        return { html, text };
    } catch (error) {
        console.error('Error loading email template:', error);
        throw new Error('Failed to load email template');
    }
}

/**
 * Log email send attempt
 */
function logEmailSend(email, status, error = null, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        email: maskEmail(email),
        type: 'otp_login',
        status,
        provider: 'resend',
        error: error ? error.message : null,
        metadata
    };

    console.log('[EMAIL]', JSON.stringify(logEntry));

    // TODO: Store in database for monitoring
}

/**
 * Send OTP email via Resend
 */
async function sendOtpEmail(email, otp, req = null) {
    try {
        // Check rate limit
        const rateLimit = checkRateLimit(email);
        if (!rateLimit.allowed) {
            const error = new Error(`Rate limit exceeded. Please try again in ${rateLimit.waitMinutes} minutes.`);
            error.code = 'RATE_LIMIT_EXCEEDED';
            error.waitMinutes = rateLimit.waitMinutes;
            throw error;
        }

        // Load templates
        const templates = await loadTemplate('otp-login');

        // Gather metadata
        const metadata = {};
        if (req) {
            const deviceInfo = getDeviceInfo(req);
            metadata.ipAddress = getIpAddress(req);
            metadata.browser = deviceInfo.browser;
            metadata.device = deviceInfo.device;
            metadata.timestamp = formatTimestamp();
        }

        // Prepare template variables
        const variables = {
            EMAIL: maskEmail(email),
            OTP: otp,
            EXPIRY_MINUTES: emailConfig.otp.expiryMinutes,
            SHOW_METADATA: req ? 'true' : '',
            IP_ADDRESS: metadata.ipAddress || '',
            BROWSER: metadata.browser || '',
            DEVICE: metadata.device || '',
            TIMESTAMP: metadata.timestamp || ''
        };

        // Replace variables in templates
        const htmlContent = replaceTemplateVars(templates.html, variables);
        const textContent = replaceTemplateVars(templates.text, variables);

        // Send email via Resend
        const result = await getResend().emails.send({
            from: `${emailConfig.sender.name} <${emailConfig.sender.email}>`,
            to: email,
            replyTo: emailConfig.replyTo,
            subject: 'Your Stockwise Login Code',
            html: htmlContent,
            text: textContent
        });

        // Log success
        logEmailSend(email, 'success', null, {
            messageId: result.id,
            ...metadata
        });

        return {
            success: true,
            messageId: result.id
        };

    } catch (error) {
        // Log failure
        logEmailSend(email, 'failed', error, {
            errorCode: error.code
        });

        throw error;
    }
}

/**
 * Clean up old rate limit entries (run periodically)
 */
function cleanupRateLimits() {
    const now = Date.now();
    const windowMs = emailConfig.otp.rateLimit.windowMinutes * 60 * 1000;

    for (const [email, attempts] of emailRateLimits.entries()) {
        const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
        if (recentAttempts.length === 0) {
            emailRateLimits.delete(email);
        } else {
            emailRateLimits.set(email, recentAttempts);
        }
    }
}

// Clean up rate limits every 10 minutes
setInterval(cleanupRateLimits, 10 * 60 * 1000);

export {
    sendOtpEmail,
    checkRateLimit
};
