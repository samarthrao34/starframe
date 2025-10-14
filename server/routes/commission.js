const express = require('express');
const router = express.Router();
const Commission = require('../models/Commission');
const { v4: uuidv4 } = require('uuid');
const pdf = require('html-pdf');
const nodemailer = require('nodemailer');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    // Configure your email provider here
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
    }
});

router.post('/', async (req, res) => {
    const { name, email, phone, location, service, budget, timeline, purpose, description, references, gst } = req.body;
    const uniqueId = 'SF-' + uuidv4();

    try {
        // Create commission in database
        const commission = await Commission.create({
            id: uniqueId,
            name,
            email,
            phone,
            location,
            service,
            budget,
            timeline,
            purpose,
            description,
            reference_links: references,
            gst
        });

        // Create PDF invoice
        const invoiceHTML = `
            <div style="padding: 20px; border: 1px solid #ddd;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #d4a574; text-shadow: 0 0 10px #d4a574;">StarFrame</h1>
                    <p>Animation Studio</p>
                </div>
                <h2>Commission Invoice</h2>
                <p><strong>Invoice ID:</strong> ${uniqueId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <hr>
                <h3>Client Details</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Location:</strong> ${location}</p>
                <hr>
                <h3>Project Details</h3>
                <p><strong>Service:</strong> ${service}</p>
                <p><strong>Budget:</strong> ${budget}</p>
                <p><strong>Timeline:</strong> ${timeline}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
                <p><strong>Description:</strong> ${description}</p>
                <p><strong>References:</strong> ${references}</p>
                <p><strong>GST Invoice Needed:</strong> ${gst ? 'Yes' : 'No'}</p>
                <hr>
                <p style="text-align: center;">Thank you for your commission request!</p>
            </div>
        `;

        const pdfBuffer = await new Promise((resolve, reject) => {
            pdf.create(invoiceHTML).toBuffer(function(err, buffer){
                if (err) {
                    reject(err);
                }
                resolve(buffer);
            });
        });

        // Send email with PDF attachment
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: `Your StarFrame Commission Invoice (ID: ${uniqueId})`,
            html: `<p>Hi ${name},</p><p>Thank you for your commission request. Please find your invoice attached.</p>`,
            attachments: [{
                filename: `invoice-${uniqueId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    reject(error);
                }
                resolve(info);
            });
        });

        res.status(200).json({ id: uniqueId });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/', async (req, res) => {
    try {
        const commissions = await Commission.findAll();
        res.json(commissions);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;