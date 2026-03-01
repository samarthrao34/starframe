# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
Transform the StarFrame Animation Studio website from a static portfolio with manual payment (UPI QR) into a fully functional e-commerce and commission platform — with proper payment processing, a digital art store with cart/checkout, streamlined commission intake with status tracking, and user accounts for a personalized client experience.

## Goals
1. **Payment Integration** — Replace manual UPI QR payment with Razorpay checkout (keeping UPI as a payment method within Razorpay) + automatic invoice/receipt generation + payment status tracking in database
2. **Digital Art Store** — Redesign the shop section with improved layout, proper cart + checkout flow, "Buy" buttons, and instant download delivery after purchase
3. **Commission System** — Simplify the commission form (essential fields only), display custom pricing, and add client-facing commission status tracking (in progress → sketch ready → completed)
4. **User Accounts** — Account creation for buyers/commission clients with order history, commission tracking, and personalized experience; guests can still browse freely
5. **Tech Debt Cleanup** — Fix duplicate DB methods, split monolithic files, establish proper code organization as a foundation for new features

## Non-Goals (Out of Scope)
- Physical prints or merchandise
- Subscription plans
- Automated pricing calculator (pricing is custom per request)
- Mobile app
- Multi-artist/multi-vendor marketplace
- Social features (comments, likes, follows)

## Users
- **Clients/Buyers** — People who want to purchase digital art or commission custom work (illustrations, character designs, 5-10s animations). They create accounts to track orders and commissions.
- **Guests** — Visitors browsing the portfolio, pricing guides, and store without an account.
- **Admin (Samarth)** — Site owner managing commissions, orders, payments, and content via the admin panel.

## Services Offered
- Custom digital artworks
- Illustrations
- Character design
- 5-10 second custom animation

## Constraints
- **Payment provider**: Razorpay (Indian payment gateway, already in dependencies)
- **Database**: SQLite3 (keep existing, no migration to Postgres for now)
- **Hosting**: Vercel (static + serverless) + optional Express server for admin
- **No build tooling**: Vanilla HTML/CSS/JS frontend (no React/Vue migration)
- **Solo developer/artist**: Admin is a single user (Samarth)

## Success Criteria
- [ ] Customers can pay via Razorpay checkout (UPI, cards, etc.) after submitting a commission
- [ ] Automatic invoice/receipt generated and shown after successful payment
- [ ] Payment status tracked in database (paid/unpaid/pending)
- [ ] Store displays digital art with cart + checkout flow
- [ ] Instant download link provided after store purchase
- [ ] Commission form simplified to essential fields only
- [ ] Commission status tracking visible to clients (in progress, sketch ready, completed)
- [ ] User accounts with login, order history, and commission tracking
- [ ] Guest browsing works without requiring account
- [ ] Tech debt items resolved (duplicate methods, monolithic files)
