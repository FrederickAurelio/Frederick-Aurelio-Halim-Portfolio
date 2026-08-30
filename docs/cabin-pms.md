---
rag:
  id: cabin-pms
  type: experience
  title: Cabin PMS
  aliases: [Cabin PMS, freelance, hospitality PMS, property management]
---

# Cabin PMS

> Portfolio knowledge source. Facts about Frederick Aurelio Halim's Cabin PMS freelance work only. Not a homepage project card — this is paid Experience.

## 1. At a glance
<!-- rag-section: cabin-at-a-glance -->
Cabin PMS is a staff property-management system Frederick Aurelio Halim built as paid freelance.
- **Role:** Freelance Full-Stack Developer.
- **Product:** Cabin PMS — staff desk for cabin/apartment hospitality. Print the product name, not the legal client.
- **Period:** July 2026 – August 2026.
- **Location:** Indonesia · Remote.
- **Repo:** https://github.com/FrederickAurelio/property-management-system
- **Live:** none — do not print a live/demo URL.
- **Scale:** 100+ units.
- **Who it's for:** Front desk and property staff, not guests booking in a browser.
- **Solo:** Frederick wrote the code.

## 2. Problem & purpose
<!-- rag-section: 2-problem-purpose -->
- **Who it's for:** Staff running cabin/apartment stays — walk-in desk and OTA desks (Booking.com, Airbnb, Agoda).
- **Domain:** Short-stay hospitality (nightly, monthly, and yearly). Not long-term landlord/tenant leasing.
- **Problem:** Front desk needed one place to book units, check guests in and out, keep OTA calendars from double-booking, and record on-site money — without buying a channel manager.
- **What it is not:** A public guest booking site. Phase 2 guest booking is scaffold only — do not say it shipped.

## 3. Features
<!-- rag-section: 3-features -->
**Reservations**
- Book nightly, monthly, and yearly stays for 100+ units.
- Check guests in and out.
- Walk-in desk and OTA-sourced stays (Booking.com, Airbnb, Agoda).
- Monthly and yearly stays occupy the unit until checkout.

**Calendar safety**
- Overlapping stays and calendar holds cannot share the same unit-dates — blocked in PostgreSQL, not only in the UI.

**Money**
- Stay totals = rent plus electricity, water, and maintenance from monthly meter readings. Long-stay quotes are a rollup, not one typed-in amount.
- Deposits, top-ups, and refunds are append-only payment movements. Quote and cash received stay separate — staff cannot silently edit past cash events.
- On-site money. Not Stripe, Midtrans, or any payment gateway.

**OTA calendars**
- Import iCal feeds on a schedule and on demand.
- Opens unconfirmed bookings and a mismatch queue when dates or units disagree with the local calendar.
- Not a Channel Manager — iCal hub only.

**Staff access & reports**
- Session RBAC: SUPER_ADMIN / ADMIN / FRONT_DESK.
- Cash / occupancy / source-mix reports and CSV (ADMIN+).

## 4. Tech stack
<!-- rag-section: 4-tech-stack -->
- **API:** TypeScript, NestJS, Prisma, PostgreSQL.
- **Staff UI:** React, Vite, TanStack Query, React Hook Form, Zod, Tailwind CSS.
- **Infra:** Docker Compose, GitHub Actions.
- **Not in this stack:** Redis, BullMQ, Socket.IO, payment gateway, PDF, email/SMS.

## 5. Architecture & decisions
<!-- rag-section: 5-architecture -->
- **Overlap safety in the database:** PostgreSQL constraints on stay ranges and calendar blocks so two confirmed bookings cannot occupy the same unit-dates. The UI is not the last line of defense.
- **Quote vs cash:** Stay quote (rent + meters) is one record. Cash in and out is an append-only ledger (`PaymentMovement`: deposit, top-up, refund). Editing history is not a silent overwrite.
- **Long stays:** Monthly and yearly occupancy lasts until checkout; utilities come from monthly meter readings, then roll into the quote.
- **OTA without a channel manager:** Scheduled and on-demand iCal import. Disagreements become unconfirmed bookings plus a staff mismatch queue instead of silently clobbering the local calendar.
- **RBAC in session:** SUPER_ADMIN / ADMIN / FRONT_DESK — front desk does not get admin reports.

## 6. What is not built
<!-- rag-section: 6-not-built -->
Honest gaps — do not claim these shipped:
- Payment gateway (Stripe, Midtrans, etc.).
- Realtime (WebSockets).
- Redis / BullMQ.
- PDF, email, or SMS.
- Channel Manager integration.
- Guest-facing public booking (Phase 2 is scaffold only).

Repo: https://github.com/FrederickAurelio/property-management-system. No live/demo URL.
