import nodemailer from 'nodemailer';

/**
 * Send an email using Nodemailer.
 * Configuration is read from environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
export async function sendMail(to: string, subject: string, html: string) {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const port = Number(process.env.SMTP_PORT ?? 465);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        console.warn(`[EMAIL] SMTP not configured. Would have sent to: ${to} | Subject: ${subject}`);
        console.warn('[EMAIL] Add SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM to .env.local');
        return;
    }

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM ?? 'no-reply@myshop.com',
        to,
        subject,
        html,
    });
    console.log(`[EMAIL] Sent to ${to} | MessageId: ${info.messageId}`);
}
