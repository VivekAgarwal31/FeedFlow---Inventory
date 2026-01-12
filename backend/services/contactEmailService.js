import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send contact form email to support
 * @param {Object} contactData - Contact form data
 * @param {string} contactData.name - Sender's name
 * @param {string} contactData.email - Sender's email
 * @param {string} contactData.message - Message content
 * @returns {Promise<Object>} Resend response
 */
export const sendContactEmail = async ({ name, email, message }) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
                    New Contact Form Submission
                </h2>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
                    <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                </div>
                
                <div style="margin: 20px 0;">
                    <h3 style="color: #333;">Message:</h3>
                    <p style="line-height: 1.6; color: #555; white-space: pre-wrap;">${message}</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="color: #888; font-size: 12px;">
                    This email was sent from the Stockwise contact form at stock-wise.in
                </p>
            </div>
        `;

        const data = await resend.emails.send({
            from: 'Stockwise Contact Form <noreply@stock-wise.in>',
            to: 'support@stock-wise.in',
            replyTo: email,
            subject: `Contact Form: Message from ${name}`,
            html: emailContent
        });

        return data;
    } catch (error) {
        console.error('Error sending contact email:', error);
        throw new Error('Failed to send contact email');
    }
};
