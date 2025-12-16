const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// Try to load Commission model, but don't crash if it fails (e.g. due to SQLite on Vercel)
let Commission;
try {
    Commission = require('../../server/models/Commission');
} catch (e) {
    console.warn('Could not load Commission model (likely due to SQLite environment):', e);
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, formData } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified
            
            // Save Commission to Database (if available)
            if (Commission && formData) {
                try {
                    const commissionId = uuidv4();
                    await Commission.create({
                        id: commissionId,
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        location: formData.location,
                        service: formData.service,
                        budget: formData.budget,
                        timeline: formData.timeline,
                        purpose: formData.purpose,
                        description: formData.description,
                        references: formData.references,
                        gst: formData.gstNeeded ? formData.gstin : null
                    });
                } catch (dbError) {
                    console.error('Error saving commission to DB:', dbError);
                    // Continue even if DB save fails
                }
            }

            if (formData) {
                // Send Email to User
                const mailOptionsUser = {
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: formData.email,
                    subject: 'Payment Received - StarFrame Animation Studio',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h1 style="color: #d4a574;">Thank you for your commission!</h1>
                            <p>Hi ${formData.name},</p>
                            <p>We have received your payment of <strong>₹${formData.amountPaid}</strong>.</p>
                            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                            
                            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Project Details</h3>
                            <ul style="list-style: none; padding: 0;">
                                <li style="margin-bottom: 10px;"><strong>Service:</strong> ${formData.serviceLabel}</li>
                                <li style="margin-bottom: 10px;"><strong>Timeline:</strong> ${formData.timelineLabel}</li>
                                <li style="margin-bottom: 10px;"><strong>Description:</strong><br>${formData.description}</li>
                            </ul>
                            
                            <p>We will review your request and get back to you shortly to discuss the next steps.</p>
                            <p>Best regards,<br><strong>StarFrame Team</strong></p>
                        </div>
                    `
                };

                // Send Email to Admin
                const mailOptionsAdmin = {
                    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                    to: process.env.EMAIL_USER, // Send to admin email
                    subject: `New Commission Request - ${formData.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif;">
                            <h2 style="color: #003087;">New Commission Received</h2>
                            <p><strong>Client:</strong> ${formData.name} (<a href="mailto:${formData.email}">${formData.email}</a>)</p>
                            <p><strong>Phone:</strong> ${formData.phone}</p>
                            <p><strong>Amount Paid:</strong> ₹${formData.amountPaid}</p>
                            <p><strong>Transaction ID:</strong> ${razorpay_payment_id}</p>
                            
                            <h3>Project Details</h3>
                            <p><strong>Service:</strong> ${formData.serviceLabel}</p>
                            <p><strong>Budget:</strong> ${formData.budgetLabel}</p>
                            <p><strong>Timeline:</strong> ${formData.timelineLabel}</p>
                            <p><strong>Purpose:</strong> ${formData.purposeLabel}</p>
                            <p><strong>Description:</strong></p>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${formData.description}</div>
                            <p><strong>References:</strong> ${formData.references || 'None'}</p>
                        </div>
                    `
                };

                try {
                    if (process.env.EMAIL_USER) {
                        await transporter.sendMail(mailOptionsUser);
                        await transporter.sendMail(mailOptionsAdmin);
                        console.log('Emails sent successfully');
                    } else {
                        console.log('Email not configured, skipping email sending.');
                    }
                } catch (emailError) {
                    console.error('Error sending email:', emailError);
                }
            }

            res.status(200).json({ status: 'success', message: 'Payment verified and processed' });
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};
