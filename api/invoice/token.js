const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  try {
    const secret = process.env.INVOICE_JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'INVOICE_JWT_SECRET not configured' });

    const token = jwt.sign({ purpose: 'invoice' }, secret, { expiresIn: '10m' });
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ token, expiresIn: 600 });
  } catch (err) {
    console.error('token error', err);
    return res.status(500).json({ error: 'internal' });
  }
};
