# PR: Implement Dynamic BANK_GUID and Cybrid Provider Integration

## Overview
This PR implements dynamic BANK_GUID configuration via environment variables in the Cybrid adapter and adds comprehensive support for the Cybrid on-ramp provider in the iPayX Quantum platform.

## Changes Made

### 1. Cybrid Provider Module (`src/providers/cybrid.ts`)
- ✅ Created new Cybrid provider adapter with full SDK integration
- ✅ Replaced hardcoded 'bank-guid' with `VITE_CYBRID_BANK_GUID` environment variable
- ✅ Added `requireEnv()` helper for robust environment variable validation
- ✅ Separated base URLs:
  - `VITE_CYBRID_BANK_BASE_URL` for SDK operations (default: https://bank.sandbox.cybrid.app)
  - `VITE_CYBRID_QUOTE_BASE_URL` for public quote API (default: https://api.cybrid.xyz)
- ✅ Implemented safe fallback for quote endpoint when unreachable
- ✅ Exported functions:
  - `createBusinessCustomer()` - Create business customer
  - `fundCadAccount()` - Fund CAD account
  - `buyUSDC()` - Purchase USDC with CAD
  - `withdrawUSDCPolygon()` - Withdraw USDC to Polygon network
  - `cybridFullFlow()` - Complete CAD → USDC → Polygon flow
  - `getCybridQuote()` - Get onramp quote from Cybrid API

### 2. Type Definitions (`src/providers/types.ts`)
- ✅ Added 'cybrid' to `ProviderName` type union
- ✅ Maintains compatibility with existing providers (ndax, crossmint, transak)

### 3. Environment Configuration (`.env.example`)
- ✅ Added Cybrid-specific environment variables with detailed comments:
  ```
  VITE_CYBRID_API_KEY=""
  VITE_CYBRID_BANK_BASE_URL="https://bank.sandbox.cybrid.app"
  VITE_CYBRID_QUOTE_BASE_URL="https://api.cybrid.xyz"
  VITE_CYBRID_BANK_GUID=""
  CYBRID_WEBHOOK_SECRET=""
  ```
- ✅ Retained all existing variables (Plaid, NDAX, Supabase, SMTP, etc.)
- ✅ Used `VITE_` prefix for frontend-accessible variables (Vite convention)

### 4. Smoke Test Script (`scripts/smoke-cybrid.sh`)
- ✅ Created bash script to validate Cybrid adapter configuration
- ✅ Checks for required environment variables
- ✅ Tests TypeScript compilation
- ✅ Provides clear instructions for manual testing

### 5. Documentation (`docs/PR_BODY_CYBRID_BANK_GUID_WEBHOOK.md`)
- ✅ This file - comprehensive PR description
- ✅ Testing instructions
- ✅ Security notes

### 6. Dependencies
- ✅ Added `@cybrid/cybrid-api-bank-typescript` - Official Cybrid SDK
- ✅ Added `axios` - HTTP client for quote API calls

## Architecture Notes

**Important**: This is a Vite/React frontend application, not Next.js. The implementation has been adapted accordingly:

- **Provider Module**: Cybrid adapter is implemented as a provider module (similar to existing `ndax.ts`)
- **Environment Variables**: Using `import.meta.env.VITE_*` instead of `process.env.*` (Vite convention)
- **Webhook Endpoint**: Cannot be implemented in pure frontend; requires separate backend service
  - For production, deploy a separate backend API to handle Cybrid webhooks
  - Use `CYBRID_WEBHOOK_SECRET` for HMAC signature verification
  - Example: Deploy to Vercel Serverless Functions, AWS Lambda, or similar

## Testing Instructions

### Prerequisites
1. Obtain Cybrid API credentials from [Cybrid Portal](https://bank.sandbox.cybrid.app)
2. Create a bank and note your BANK_GUID

### Local Testing
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set:
# VITE_CYBRID_API_KEY=your_api_key
# VITE_CYBRID_BANK_GUID=your_bank_guid

# 3. Run smoke test
./scripts/smoke-cybrid.sh

# 4. Start development server
npm run dev

# 5. Test in browser
# Navigate to onramp page, select Cybrid as provider
# Verify quotes are fetched (or fallback is used)
```

### Testing the Full Flow
```typescript
import { cybridFullFlow } from './providers/cybrid';

// In browser console or test file:
await cybridFullFlow();
// Should complete: CAD deposit → USDC purchase → Polygon withdrawal
```

## Security Notes

### ✅ Safe Practices
- No hardcoded credentials or secrets committed
- All sensitive values in `.env.example` are empty placeholders
- Environment variable validation with clear error messages
- Safe fallback behavior when API is unreachable

### ⚠️ Important Security Considerations

1. **API Keys in Frontend**:
   - Current implementation exposes `VITE_CYBRID_API_KEY` to frontend
   - For production: Use a backend proxy to keep API keys server-side
   - Consider implementing a backend API that wraps Cybrid calls

2. **Webhook Security**:
   - Webhook endpoint requires a separate backend service
   - Must implement HMAC signature verification using `CYBRID_WEBHOOK_SECRET`
   - Never expose webhook secret to frontend

3. **Rate Limiting**:
   - Implement rate limiting on quote endpoint calls
   - Consider caching quotes to reduce API calls

## Breaking Changes
None. This PR is purely additive and does not modify existing functionality.

## Acceptance Criteria
- ✅ TypeScript builds without errors
- ✅ No hardcoded BANK_GUID; adapter strictly uses `VITE_CYBRID_BANK_GUID`
- ✅ Quote adapter returns valid structure with safe fallback
- ✅ No secrets committed; only `.env.example` updated
- ✅ Smoke test script validates configuration
- ✅ All existing providers continue to work

## Screenshots
_N/A - Backend/provider integration, no UI changes_

## Related Issues
Implements: Dynamic BANK_GUID via environment variable for Cybrid adapter

## Next Steps (Future PRs)
1. Implement backend API proxy for secure Cybrid API calls
2. Deploy webhook endpoint service (Vercel/Lambda/etc.)
3. Add integration tests for Cybrid provider
4. Implement webhook signature verification
5. Add Cybrid provider to UI provider selection
6. Add monitoring and alerting for Cybrid API failures
