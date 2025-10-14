const express = require('express');
const router = express.Router();
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const INVOICE_JWT_SECRET = process.env.INVOICE_JWT_SECRET || 'please-change-me-in-prod';

// Configure transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 465,
    secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// POST /api/invoice/send
// Expects: { to, subject, html, plainText } (html is invoice HTML)
router.post('/send', async (req, res) => {
    try {
        // Verify bearer token
        const auth = req.headers.authorization || '';
        if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
        const token = auth.replace('Bearer ', '');
        try {
            jwt.verify(token, INVOICE_JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (err) {
        return res.status(401).json({ error: 'Authorization failed' });
    }
    try {
        const { to, subject, html, plainText } = req.body;

        if (!to || !html) return res.status(400).json({ error: 'Missing to or html' });

        // Create PDF buffer
        const pdfBuffer = await new Promise((resolve, reject) => {
            pdf.create(html, { format: 'A4', border: '10mm' }).toBuffer((err, buffer) => {
                if (err) return reject(err);
                resolve(buffer);
            });
        });

        // Send email with PDF attached
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject: subject || 'Your StarFrame Invoice',
            text: plainText || 'Please find attached your invoice from StarFrame.',
            html: html, // include html body
            attachments: [{ filename: `invoice-${Date.now()}.pdf`, content: pdfBuffer }]
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true });
    } catch (err) {
        console.error('Invoice send error:', err);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
});

// GET /api/invoice/token
// Returns a short-lived JWT that can be used to POST to /send
router.get('/token', (req, res) => {
    const payload = { iss: 'starframe', ts: Date.now() };
    // short-lived token (10 minutes)
    const token = jwt.sign(payload, INVOICE_JWT_SECRET, { expiresIn: '10m' });
    res.json({ token, expiresIn: 600 });
});

module.exports = router;
