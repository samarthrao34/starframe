# DECISIONS.md — Architecture Decision Records

> Tracks key technical decisions made during the project.

## ADR-001: Keep SQLite3 for v2.0
**Date**: 2026-03-01
**Status**: Accepted
**Context**: Considered migrating to PostgreSQL for the e-commerce features.
**Decision**: Keep SQLite3 — sufficient for single-admin, low-to-moderate traffic art studio site. Avoids unnecessary infrastructure complexity.
**Consequences**: May need to revisit if concurrent write volume grows significantly.

## ADR-002: Razorpay as Payment Gateway
**Date**: 2026-03-01
**Status**: Accepted
**Context**: Currently using manual UPI QR code for payments.
**Decision**: Integrate Razorpay (already in dependencies) — supports UPI, cards, netbanking. Replaces manual QR with verified checkout.
**Consequences**: Requires Razorpay account setup, webhook configuration, and server-side payment verification.

## ADR-003: Google Drive as Portfolio Image Source
**Date**: 2026-03-01
**Status**: Accepted
**Context**: Need to display all StarFrame artworks on a portfolio page without hosting images locally (which would bloat the repo and slow deploys).
**Decision**: Fetch images from shared Google Drive folder via Drive API. Server-side caching of file list, lazy loading, and Drive thumbnail URLs for performance.
**Consequences**: Requires Google API key (read-only). Drive must remain publicly shared. Need cache invalidation strategy when new art is added.
