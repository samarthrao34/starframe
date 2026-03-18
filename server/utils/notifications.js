const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const STATUS_LABELS = {
    queued: 'Submitted',
    in_progress: 'In Progress',
    sketch: 'Sketch Ready',
    final: 'Final Art',
    completed: 'Completed'
};

const STATUS_DESCRIPTIONS = {
    queued: 'Your commission request has been received and is in our queue.',
    in_progress: 'Our artist has started working on your project!',
    sketch: 'The initial sketch is ready for your review.',
    final: 'The final artwork is being polished and prepared for delivery.',
    completed: 'Your commission is complete! Thank you for choosing StarFrame.'
};

/**
 * Send a commission status update email to the client.
 * @param {Object} commission - Commission record from DB
 * @param {string} newStatus - The new status being set
 * @param {string} [adminNote] - Optional note from the admin
 */
async function sendStatusUpdateEmail(commission, newStatus, adminNote) {
    if (!process.env.EMAIL_USER || !commission.email) {
        logger.warn('Email not configured or no client email — skipping notification');
        return;
    }

    const statusLabel = STATUS_LABELS[newStatus] || newStatus;
    const statusDesc = STATUS_DESCRIPTIONS[newStatus] || '';
    const trackUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/track-commission.html?id=${encodeURIComponent(commission.id)}`;

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center;">
            <h1 style="color: #d4a574; margin: 0; font-size: 1.8rem;">StarFrame</h1>
            <p style="color: #ccc; margin: 5px 0 0; font-size: 0.9rem;">Animation Studio</p>
        </div>

        <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Commission Status Update</h2>
            <p>Hi ${commission.name},</p>
            <p>Your commission <strong>${commission.id}</strong> has been updated:</p>

            <div style="background: #f8f9fa; border-left: 4px solid #d4a574; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                <div style="font-size: 0.85rem; color: #999; text-transform: uppercase; letter-spacing: 1px;">Current Status</div>
                <div style="font-size: 1.4rem; font-weight: 700; color: #1a1a1a; margin: 5px 0;">${statusLabel}</div>
                <p style="color: #666; margin: 8px 0 0;">${statusDesc}</p>
            </div>

            ${adminNote ? `
            <div style="background: #fff3e0; padding: 15px 20px; border-radius: 8px; margin: 15px 0;">
                <strong>Note from our team:</strong>
                <p style="margin: 5px 0 0; color: #555;">${adminNote}</p>
            </div>` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${trackUrl}" style="display: inline-block; background: #d4a574; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Track Your Commission
                </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
            <p style="font-size: 0.85rem; color: #999;">
                If you have questions, reply to this email or contact us at 
                <a href="mailto:starframeanimationstudios@gmail.com" style="color: #d4a574;">starframeanimationstudios@gmail.com</a>.
            </p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8rem; color: #999;">
            &copy; ${new Date().getFullYear()} StarFrame Animation Studio. All rights reserved.
        </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: commission.email,
            subject: `Commission Update: ${statusLabel} — ${commission.id}`,
            html
        });
        logger.info(`Status update email sent to ${commission.email} for ${commission.id}`);
    } catch (err) {
        logger.error(`Failed to send status update email for ${commission.id}:`, err);
    }
}

/**
 * Send a new commission confirmation email to the client.
 */
async function sendCommissionConfirmationEmail(commission) {
    if (!process.env.EMAIL_USER || !commission.email) return;

    const trackUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/track-commission.html?id=${encodeURIComponent(commission.id)}`;

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 30px; text-align: center;">
            <h1 style="color: #d4a574; margin: 0; font-size: 1.8rem;">StarFrame</h1>
            <p style="color: #ccc; margin: 5px 0 0; font-size: 0.9rem;">Animation Studio</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Commission Request Received!</h2>
            <p>Hi ${commission.name},</p>
            <p>Thank you for your commission request. Here are your details:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #888; width: 35%;">Commission ID</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">${commission.id}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;">Service</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${commission.service || '—'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;">Budget</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${commission.budget || '—'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #888;">Timeline</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${commission.timeline || '—'}</td></tr>
                <tr><td style="padding: 10px; color: #888;">Status</td><td style="padding: 10px; font-weight: 600; color: #d4a574;">Submitted</td></tr>
            </table>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${trackUrl}" style="display: inline-block; background: #d4a574; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    Track Your Commission
                </a>
            </div>

            <p style="color: #666;">We'll review your request and update you as we begin work. You'll receive email notifications at each milestone.</p>
        </div>
        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8rem; color: #999;">
            &copy; ${new Date().getFullYear()} StarFrame Animation Studio. All rights reserved.
        </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: commission.email,
            subject: `Commission Received — ${commission.id}`,
            html
        });
        logger.info(`Confirmation email sent to ${commission.email} for ${commission.id}`);
    } catch (err) {
        logger.error(`Failed to send confirmation email for ${commission.id}:`, err);
    }
}

/**
 * Send a purchase confirmation email with download link.
 */
async function sendPurchaseConfirmationEmail(purchase, product, downloadUrl) {
    if (!process.env.EMAIL_USER || !purchase.email) return;

    const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 1.8rem;">StarFrame Art Shop</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 0.9rem;">Your purchase is ready!</p>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Thank You for Your Purchase!</h2>
            <p>Hi there,</p>
            <p>Your payment has been verified. Here are your purchase details:</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px; color: #333;">${product.title}</h3>
                <p style="color: #666; margin: 5px 0;">Category: ${product.category}</p>
                <p style="font-size: 1.3rem; font-weight: 700; color: #667eea; margin: 10px 0 0;">₹${product.price_inr}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${downloadUrl}" style="display: inline-block; background: #667eea; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    <i class="fas fa-download"></i> Download Your Art
                </a>
                <p style="font-size: 0.85rem; color: #999; margin-top: 10px;">This link is valid for 7 days.</p>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 15px; text-align: center; font-size: 0.8rem; color: #999;">
            &copy; ${new Date().getFullYear()} StarFrame Animation Studio. All rights reserved.
        </div>
    </div>`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: purchase.email,
            subject: `Your StarFrame Purchase: ${product.title}`,
            html
        });
        logger.info(`Purchase confirmation email sent for product ${product.id}`);
    } catch (err) {
        logger.error('Failed to send purchase confirmation email:', err);
    }
}

module.exports = {
    sendStatusUpdateEmail,
    sendCommissionConfirmationEmail,
    sendPurchaseConfirmationEmail
};
