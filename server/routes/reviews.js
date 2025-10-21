const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Database = require('../models/Database');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/reviews - public list of recent reviews
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const reviews = await Database.getRecentReviews(limit);
    res.json({ reviews });
  } catch (error) {
    logger.error('Failed to fetch reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews - public create review
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('city').optional().trim().isLength({ max: 120 }).withMessage('City too long'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message 10-2000 chars')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }

      const { name, city, rating, message } = req.body;
      const ip_address = (req.headers['x-forwarded-for'] || req.ip || '').toString();
      const user_agent = req.get('User-Agent') || '';

      const result = await Database.createReview({ name, city, rating, message, ip_address, user_agent });

      const created = {
        id: result.id,
        name,
        city: city || null,
        rating,
        message,
        created_at: new Date().toISOString()
      };

      // Emit real-time event to all clients
      const io = req.app.get('io');
      if (io) {
        io.emit('review-created', created);
      }

      res.status(201).json({ success: true, review: created });
    } catch (error) {
      logger.error('Failed to create review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

// DELETE /api/reviews/:id - admin-only delete
router.delete(
  '/:id',
  [param('id').isInt().toInt()],
  auth.requireAuth,
  async (req, res) => {
    try {
      const id = req.params.id;
      await Database.deleteReview(id);

      const io = req.app.get('io');
      if (io) {
        io.emit('review-deleted', { id: Number(id) });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete review:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
);

module.exports = router;
