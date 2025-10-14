const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const htmlPdf = require('html-pdf');

function renderPdfBuffer(html) {
  return new Promise((resolve, reject) => {
    htmlPdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const secret = process.env.INVOICE_JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'INVOICE_JWT_SECRET not configured' });

    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/, '');
    if (!token) return res.status(401).json({ error: 'no token' });

    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(403).json({ error: 'invalid token' });
    }

    const { to, subject = 'Invoice', html } = req.body || {};
    if (!to || !html) return res.status(400).json({ error: 'missing to or html' });

    const pdfBuffer = await renderPdfBuffer(html);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text: 'Please find attached your invoice.',
      attachments: [
        { filename: 'invoice.pdf', content: pdfBuffer }
      ]
    });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('send invoice error', err);
    return res.status(500).json({ error: 'internal' });
  }
};
