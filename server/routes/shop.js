const express = require('express');
const router = express.Router();
const Database = require('../models/Database');
const logger = require('../utils/logger');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'YOUR_KEY_ID',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET'
});

// GET /api/shop/products
// Fetch all active products
router.get('/products', async (req, res) => {
    try {
        const products = await Database.getProducts(true);
        res.json({ success: true, products });
    } catch (err) {
        logger.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to load products' });
    }
});

// GET /api/shop/product/:id
// Fetch single product details
router.get('/product/:id', async (req, res) => {
    try {
        const product = await Database.getProduct(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, product });
    } catch (err) {
        logger.error('Error fetching product:', err);
        res.status(500).json({ error: 'Failed to find product' });
    }
});

// POST /api/shop/create-order
// Create a Razorpay order for cart items
router.post('/create-order', async (req, res) => {
    try {
        const { items } = req.body; // Array of { product_id, quantity }

        if (!items || !items.length) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Ensure user is logged in
        if (!req.user && !req.session.userId) {
            return res.status(401).json({ error: 'Please login to checkout' });
        }

        // Calculate total from DB prices (never trust client-side amounts)
        let total = 0;
        const validatedItems = [];
        for (const item of items) {
            const product = await Database.getProduct(item.product_id);
            if (!product || !product.is_active) {
                return res.status(400).json({ error: `Product "${item.product_id}" not found or unavailable` });
            }
            const qty = Math.max(1, parseInt(item.quantity) || 1);
            total += product.price_inr * qty;
            validatedItems.push({ product, quantity: qty });
        }

        const receipt = `shop_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const order = await razorpay.orders.create({
            amount: total * 100, // paise
            currency: 'INR',
            receipt,
            payment_capture: 1
        });

        res.json({
            success: true,
            order_id: order.id,
            amount: total,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
            receipt,
            items: validatedItems.map(vi => ({
                id: vi.product.id,
                title: vi.product.title,
                price: vi.product.price_inr,
                quantity: vi.quantity
            }))
        });
    } catch (err) {
        logger.error('Shop create-order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// POST /api/shop/verify-payment
// Verify Razorpay payment and record purchases + generate download tokens
router.post('/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = req.body;

        if (!req.user && !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const clientId = req.user ? req.user.id : req.session.userId;

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YOUR_KEY_SECRET')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        // Record a payment entry
        const paymentResult = await Database.createPayment({
            client_id: clientId,
            amount: 0, // Will be updated
            utr_number: razorpay_payment_id,
            receipt_path: null
        });

        // Record each purchase with a download token
        const downloads = [];
        let totalAmount = 0;
        for (const item of items) {
            const product = await Database.getProduct(item.product_id);
            if (!product) continue;

            totalAmount += product.price_inr * (item.quantity || 1);

            const download_token = crypto.randomBytes(16).toString('hex');
            await Database.recordPurchase({
                client_id: clientId,
                product_id: item.product_id,
                payment_id: paymentResult.id,
                download_token
            });

            downloads.push({
                product_id: product.id,
                title: product.title,
                download_token,
                download_url: `/api/shop/download/${download_token}`
            });
        }

        // Update payment amount
        await Database.run('UPDATE payments SET amount = ?, status = ? WHERE id = ?', [totalAmount, 'verified', paymentResult.id]);

        // Send purchase email (non-blocking)
        try {
            const { sendPurchaseConfirmationEmail } = require('../utils/notifications');
            const client = await Database.getClientById(clientId);
            if (client) {
                for (const dl of downloads) {
                    const product = await Database.getProduct(dl.product_id);
                    const downloadUrl = `${process.env.BASE_URL || 'http://localhost:3001'}${dl.download_url}`;
                    sendPurchaseConfirmationEmail(
                        { email: client.email },
                        product,
                        downloadUrl
                    ).catch(err => logger.error('Purchase email failed:', err));
                }
            }
        } catch (emailErr) {
            logger.error('Email notification failed (non-fatal):', emailErr);
        }

        res.json({
            success: true,
            message: 'Payment verified! Your downloads are ready.',
            downloads
        });

    } catch (err) {
        logger.error('Shop verify-payment error:', err);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// POST /api/shop/record-purchase
// Record a completed purchase (could be called by webhook or frontend after Razorpay/UPI success)
router.post('/record-purchase', async (req, res) => {
    try {
        const { product_id, payment_id } = req.body;

        if (!req.user && !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const clientId = req.user ? req.user.id : req.session.userId;

        const download_token = require('crypto').randomBytes(16).toString('hex');

        const purchaseId = await Database.recordPurchase({
            client_id: clientId,
            product_id,
            payment_id,
            download_token
        });

        res.json({ success: true, download_token, purchaseId });

    } catch (err) {
        logger.error('Error recording purchase:', err);
        res.status(500).json({ error: 'Failed to record purchase' });
    }
});

// GET /api/shop/my-purchases
// Get purchase history for logged-in client
router.get('/my-purchases', async (req, res) => {
    try {
        if (!req.user && !req.session.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const clientId = req.user ? req.user.id : req.session.userId;

        const purchases = await Database.all(`
            SELECT p.*, pr.title, pr.image_url, pr.category, pr.price_inr,
                   pay.status as payment_status
            FROM purchases p
            JOIN products pr ON p.product_id = pr.id
            LEFT JOIN payments pay ON p.payment_id = pay.id
            WHERE p.client_id = ?
            ORDER BY p.created_at DESC
        `, [clientId]);

        res.json({ success: true, purchases });
    } catch (err) {
        logger.error('Error fetching purchases:', err);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

// GET /api/shop/download/:token
// Secure download endpoint
router.get('/download/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const purchase = await Database.getPurchaseByToken(token);

        if (!purchase) {
            return res.status(404).json({ error: 'Invalid or expired download link' });
        }

        if (purchase.payment_status !== 'verified') {
            return res.status(403).send(`
                <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h2 style="color: #667eea;">Payment Verification Pending</h2>
                    <p>Your payment (Transaction ID) is currently being verified by our team.</p>
                    <p>This download link will automatically unlock once the verification is complete.</p>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Close Window</button>
                </body>
                </html>
            `);
        }

        // For MVP, we will redirect to the file URL.
        res.redirect(purchase.file_url);

    } catch (err) {
        logger.error('Error serving download:', err);
        res.status(500).json({ error: 'Download error' });
    }
});

module.exports = router;
