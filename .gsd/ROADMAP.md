# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v2.0 — StarFrame E-Commerce & Commission Platform

## Must-Haves (from SPEC)
- [ ] Razorpay payment checkout (replacing manual UPI QR)
- [ ] Auto invoice/receipt after payment
- [ ] Payment status in database
- [ ] Store redesign with cart + checkout + instant download
- [ ] Simplified commission form with pricing
- [ ] Commission status tracking (client-facing)
- [ ] User accounts with order/commission history
- [ ] Guest browsing preserved
- [ ] Tech debt resolved

## Phases

### Phase 1: Foundation & Tech Debt
**Status**: ⬜ Not Started
**Objective**: Clean up codebase and establish solid patterns for new feature development
**Scope**:
- Fix duplicate methods in `Database.js` (createReview, getRecentReviews defined twice)
- Split `Database.js` monolith into domain-specific modules (users, analytics, reviews, commissions, orders)
- Split `js/script-new.js` (49KB) into modular frontend files
- Establish consistent error handling patterns
- Clean up documentation sprawl (consolidate root-level markdown files)
- Verify existing server starts and pages load correctly

### Phase 2: User Accounts & Authentication
**Status**: ⬜ Not Started
**Objective**: Client-facing account system for buyers and commission clients
**Depends on**: Phase 1
**Scope**:
- Client registration (email/password) — separate from admin auth
- Client login page and session management
- Client profile/dashboard page (order history, commission history)
- Guest browsing preserved (no login required to view store/portfolio)
- Database schema: clients table with profile data
- Password reset flow

### Phase 3: Payment Integration
**Status**: ⬜ Not Started
**Objective**: Replace manual UPI QR with Razorpay checkout + automatic invoicing
**Depends on**: Phase 2
**Scope**:
- Razorpay checkout integration (supports UPI, cards, netbanking)
- Payment order creation flow (server-side)
- Payment verification with signature validation
- Payment status tracking in database (pending → paid → failed)
- Automatic invoice/receipt generation after successful payment
- Invoice PDF generation and display
- Wire up existing `api/payment/` serverless functions

### Phase 4: Commission System Overhaul
**Status**: ⬜ Not Started
**Objective**: Streamlined commission intake with pricing display and status tracking
**Depends on**: Phase 3
**Scope**:
- Simplified commission form (name, email, service type, description, references, budget)
- Display service pricing guide (custom digital art, illustrations, character design, animation)
- Commission → payment flow (form submit → Razorpay checkout → receipt)
- Commission status tracking: submitted → in progress → sketch ready → completed
- Client-facing commission tracker (linked to user account)
- Admin commission management (update status, view details)
- Email/notification on status changes

### Phase 5: Digital Art Store
**Status**: ⬜ Not Started
**Objective**: Redesigned store with cart, checkout, and instant digital download
**Depends on**: Phase 3
**Scope**:
- Store page redesign (improved layout, grid/card design)
- Product catalog with images, descriptions, pricing
- "Buy" button on each product
- Shopping cart (add/remove items, quantity, total)
- Checkout flow → Razorpay payment
- Instant download link after successful purchase
- Digital file delivery system (secure download URLs)
- Purchase history linked to user account
- Admin product management (add/edit/delete art listings)
