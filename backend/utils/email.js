import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and populate email template with data
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {object} data - Data to populate in the template
 * @returns {string} - Populated HTML template
 */
export const loadEmailTemplate = (templateName, data) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        let template = fs.readFileSync(templatePath, 'utf-8');

        // Replace placeholders with actual data
        Object.keys(data).forEach(key => {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, 'g'), data[key]);
        });

        return template;
    } catch (error) {
        console.error('Error loading email template:', error);
        throw new Error('Failed to load email template');
    }
};

/**
 * Generate OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP code
 */
export const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

/**
 * Send email using Resend
 */
export const sendEmail = async ({ to, subject, html }) => {
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: 'Cattle Feed Manager <authentication@bhagro.site>',
            to,
            subject,
            html
        });

        if (error) {
            console.error('❌ Resend error:', error);
            throw new Error(error.message);
        }

        console.log('✅ Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw error;
    }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name
 * @param {string} otpCode - OTP code to send
 */
export const sendOTPEmail = async (email, userName, otpCode) => {
    const html = loadEmailTemplate('otp-email', {
        userName: userName || 'User',
        otpCode: otpCode
    });

    await sendEmail({
        to: email,
        subject: '🔐 Your Login Code - Cattle Feed Manager',
        html
    });
};

export default {
    loadEmailTemplate,
    generateOTP,
    sendEmail,
    sendOTPEmail
};
