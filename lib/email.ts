import nodemailer from 'nodemailer';

/**
 * Send an email using Nodemailer.
 * Configuration is read from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
export async function sendMail(to: string, subject: string, html: string) {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback to a test transport that logs email to console
        transporter = nodemailer.createTransport({
            jsonTransport: true,
        });
        console.warn('SMTP configuration missing – using test email transport.');
    }

    await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'no-reply@myshop.com',
        to,
        subject,
        html,
    });
}
