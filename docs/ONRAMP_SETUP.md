# On-Ramp Integration Setup

## 🎯 Providers Configured

- ✅ **Coinbase Commerce** - Fiat payment processor with instant settlement
  - Supports Card, Apple Pay, Interac e-Transfer (CAD)
  - 150+ countries coverage
  - Direct fiat payment (no crypto wallet required)
- ✅ **Coinbase Pay** - Crypto on-ramp for wallet-based payments
- ✅ **Transak** - Global coverage (150+ countries, 100+ fiat currencies)
- ⏳ **Mercuryo** - Optional future provider

## 📋 Environment Variables

### Public Variables (in `.env`)

```env
# Coinbase On-Ramp (public client ID)
VITE_COINBASE_APP_ID=your_coinbase_app_id_here

# Transak (public API key)
VITE_TRANSAK_API_KEY=your_transak_api_key_here
VITE_TRANSAK_ENV=STAGING  # Change to PRODUCTION when ready
```

### Private Secrets (via Lovable Cloud → Secrets)

- `COINBASE_API_KEY` - API key for Coinbase Commerce (payment processing)
- `COINBASE_WEBHOOK_SECRET` - Secret for validating Coinbase webhooks
- `TRANSAK_WEBHOOK_SECRET` - Secret for validating Transak webhooks

## 🔗 Edge Functions & Webhook Endpoints

### Edge Functions
- `/coinbase-checkout` - Creates Coinbase Commerce payment session
- `/coinbase-webhook` - Handles Coinbase payment status updates

Configure these webhook URLs in your provider dashboards:

### Coinbase Webhook URL
```
https://ggkymbeyesuodnoogzyb.supabase.co/functions/v1/coinbase-webhook
```

### Transak Webhook URL
```
https://ggkymbeyesuodnoogzyb.supabase.co/functions/v1/transak-webhook
```

## 🧪 Testing Flow

### Coinbase Commerce (Fiat Payments)
1. **Navigate to `/quote`** in your browser
2. **Enter payment details** (from/to country, amount)
3. **Click "Get Best Routes"**
4. **Click "Pay with Card / Interac e-Transfer"** on any route
5. **Complete payment** on Coinbase Checkout page:
   - Test card: `4242 4242 4242 4242`
   - Or test with Interac e-Transfer (CAD only)
6. **Verify webhook** in Lovable Cloud → Backend → `webhook_events` table
7. **Check transaction log** in `transaction_logs` table

### Coinbase Pay (Crypto On-Ramp)
1. **Navigate to `/onramp`** in your browser
2. **Connect MetaMask wallet** (supports EVM + Tron via Snap)
3. **Select Coinbase provider**
4. **Test purchase** using test card `4242 4242 4242 4242`
5. **Verify webhook** and transaction log

## 📊 Database Tables

The integration uses these tables:

- **`webhook_events`** - Stores all incoming webhook payloads
- **`transaction_logs`** - Tracks on-ramp transactions
- **`activity_logs`** - Logs user security actions

## 🚀 Production Checklist

Before going live, complete these steps:

- [ ] **Get production API keys** from Coinbase and Transak
- [ ] **Configure webhook URLs** in provider dashboards
- [ ] **Set webhook secrets** in Lovable Cloud Secrets
- [ ] **Update `.env`**: Set `VITE_TRANSAK_ENV=PRODUCTION`
- [ ] **Test with small amount** ($10-20) on production
- [ ] **Monitor webhook logs** for first 24 hours
- [ ] **Enable real-time alerts** for failed webhooks
- [ ] **Document support process** for stuck transactions

## 🔐 Security Notes

- ✅ All webhook secrets stored server-side only
- ✅ Webhook signature validation implemented
- ✅ IP rate limiting active (60 requests/min)
- ✅ CORS properly configured
- ✅ All transactions logged for audit trail

## 📖 Provider Documentation

- **Coinbase Onramp Docs**: https://docs.cloud.coinbase.com/pay-sdk/docs/onramp
- **Transak API Docs**: https://docs.transak.com/
- **MetaMask Snap Docs**: https://metamask.io/snaps/

## 🆘 Troubleshooting

### Widget not opening?
- Check browser console for errors
- Verify API keys are set correctly
- Ensure MetaMask is installed

### Webhook not received?
- Check webhook URL configuration in provider dashboard
- Verify webhook secret matches in Lovable Cloud Secrets
- Check Edge Function logs in Lovable Cloud → Backend

### Transaction stuck?
- Check provider dashboard for transaction status
- Verify wallet address is correct
- Contact provider support with transaction ID

---

**Last Updated**: 2025-10-17  
**Version**: iPAYX Protocol V4
