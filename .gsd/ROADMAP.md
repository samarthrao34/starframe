# ROADMAP.md

> **Current Phase**: Phase 5 Complete — Proceeding to Phase 6
> **Milestone**: v2.0 — StarFrame E-Commerce & Commission Platform

## Must-Haves (from SPEC)
- [x] Razorpay payment checkout (replacing manual UPI QR)
- [ ] Auto invoice/receipt after payment
- [x] Payment status in database
- [x] Store redesign with cart + checkout + instant download
- [x] Simplified commission form with pricing
- [x] Commission status tracking (client-facing)
- [x] User accounts with order/commission history
- [x] Guest browsing preserved
- [ ] Tech debt resolved
- [ ] Portfolio gallery page fetching from Google Drive

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
**Status**: ✅ Complete
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
**Status**: ✅ Complete
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

### Phase 6: Portfolio Gallery
**Status**: ⬜ Not Started
**Objective**: Beautiful showcase of all StarFrame artworks, fetched from Google Drive
**Depends on**: Phase 1
**Scope**:
- Portfolio/gallery page with responsive masonry or grid layout
- Google Drive API integration to fetch images from [VIP Art&Animation folder](https://drive.google.com/drive/folders/1-kWwXckAlTxWPtF7YrIYFYWNr42JmMy7)
- Server-side caching of Drive file list (avoid hitting API on every page load)
- Optimized image loading: thumbnails via Drive API, lazy loading, progressive rendering
- Lightbox/modal for full-size image viewing
- Category/filter support (if folder has subfolders)
- Image metadata display (title, dimensions)
- Performance budget: gallery page must load under 3s on 3G
