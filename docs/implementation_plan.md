# Implementation Plan for Fully Automated Checkout

## Goal Description
We need to replace the manual, admin‑verified payment flow for sponsored ad promotions with a fully automated checkout system. Sellers will initiate a promotion, the server will create a payment request via a configurable wallet partner API, redirect the seller to a payment page, and automatically mark the promotion as paid/featured when the payment succeeds. Admins can configure the wallet partner by setting environment variables at deployment time.

## User Review Required
- Confirm the name of the environment variables for the wallet API endpoint, API key, and optional callback secret.
- Approve the webhook URL design (`/api/wallet/webhook`).
- Choose whether to store payment provider transaction IDs in the existing `promotionRequests` table or create a new `promotionPayments` table.

## Open Questions
> [!IMPORTANT] Are there any specific wallet partners (e.g., PayPal, Stripe, local bank API) that have special fields we need to support? If so, list required request parameters.
> [!IMPORTANT] Should the payment be initiated from the seller UI (frontend) via a `createPromotionPayment` mutation that returns a redirect URL, or should the server directly redirect?

## Proposed Changes
---
### Server (`server/routers/ads.ts`)
- Add new **environment config** read via `process.env.WALLET_API_URL`, `process.env.WALLET_API_KEY`, `process.env.WALLET_CALLBACK_SECRET`.
- Create a **new table** `promotionPayments` (or extend `promotionRequests` with `paymentProviderId` and `paymentUrl`).
- New procedure **`createPromotionPayment`** (protected):
  - Validate listing ownership.
  - Fetch pricing tier.
  - Insert a row into `promotionRequests` with `paymentStatus: "pending"` and store a generated `paymentProviderId` (optional).
  - Call wallet partner API (POST to `${WALLET_API_URL}/payments`) with payload:
    ```json
    {
      "amount": priceNPR,
      "currency": "NPR",
      "description": "Promotion for listing <id>",
      "callbackUrl": "${WALLET_CALLBACK_BASE}/api/wallet/webhook",
      "metadata": {"requestId": <promotionRequestId>}
    }
    ```
  - Include `Authorization: Bearer ${WALLET_API_KEY}` header.
  - Expect response `{ paymentUrl: string, providerPaymentId: string }`.
  - Update the request row with `paymentProviderId` and return `paymentUrl` to the client.
- New **webhook route** (`/api/wallet/webhook`):
  - Verify signature using `WALLET_CALLBACK_SECRET` (simple HMAC of body).
  - Extract `providerPaymentId` and status (`paid`).
  - Find the matching `promotionRequests` (by `paymentProviderId`).
  - If paid, set `paymentStatus: "paid"` and automatically mark the listing as featured (same logic as admin approve but without admin notes).
  - Return 200 OK.
- Update **adminReviewPromotion** to optionally skip payment check if `paymentStatus === "paid"` or allow admin to force‑approve.
- Adjust **`promoteListing`** mutation to become a thin wrapper that calls `createPromotionPayment` and returns the URL.

---
### Client (`client/src/pages/SellerDashboard.tsx`)
- Replace the Promote button’s `onClick` handler to call a new mutation `ads.initiatePromotion` (which invokes `createPromotionPayment`).
- On success, open the returned `paymentUrl` in a new tab/window (`window.open(url, "_blank")`).
- Optionally show a loading state until the payment URL is received.
- After the user completes payment, the webhook will auto‑feature the listing; the UI can refresh listings to show the `Featured` badge.

---
### Database (`drizzle/schema.ts`)
- Add columns to `promotionRequests`:
  - `paymentProviderId: varchar(255).optional()`
  - `paymentUrl: varchar(512).optional()`
- Optionally create a separate `promotionPayments` table with fields:
  - `id`, `requestId`, `providerId`, `status`, `createdAt`.

---
### Environment / Deployment
- Document required env vars:
  - `WALLET_API_URL` – Base URL of the partner’s payment endpoint.
  - `WALLET_API_KEY` – API key/token for authentication.
  - `WALLET_CALLBACK_SECRET` – Secret used to verify webhook payloads.
  - `WALLET_CALLBACK_BASE` – Base URL of our server (e.g., `https://app.example.com`).
- Add these to `.env.example` and update deployment scripts to inject them.

## Verification Plan
### Automated Tests
- Unit test `createPromotionPayment` mocks the wallet API (using `nock` or similar) and asserts that the returned URL matches the mock response and that the DB row is updated.
- Integration test for the webhook: POST a simulated payload with correct signature, verify the promotion request’s `paymentStatus` updates to `paid` and the listing’s `isFeatured` flag is set.
- Run `npm run test && npm run lint && npx tsc --noEmit`.
### Manual Verification
- Deploy to a staging environment, set env vars for a test wallet sandbox (e.g., Stripe test mode). Initiate a promotion, follow the redirected payment page, complete payment, and confirm the listing appears as featured without admin intervention.

---
**End of Plan**
