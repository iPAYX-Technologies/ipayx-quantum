# Meta-Router API Specification

This document defines the expected API contract for the Python backend Meta-Router service that will be deployed on Railway.

## Base URL
```
https://meta-router.railway.app
```

## Authentication
No authentication required for demo purposes. Production should use API keys.

---

## Endpoints

### POST /quote

Get optimal routing quote for cross-chain transfers.

**Request:**
```json
{
  "fromNetwork": "ETHEREUM",
  "toNetwork": "BASE",
  "asset": "USDC",
  "amount": 50000
}
```

**Response:**
```json
{
  "routes": [
    {
      "rail": "LayerZero",
      "provider": "bridge",
      "score": 92.1,
      "feePct": 0.75,
      "etaMin": 2,
      "quoteFX": 1.0,
      "oracleFX": 1.0,
      "fxSpread": "0.0%",
      "liq": 9,
      "vol": 0.1,
      "status": "available",
      "amount": 50000,
      "amountOut": 49625.0
    },
    {
      "rail": "Wormhole",
      "provider": "bridge",
      "score": 88.5,
      "feePct": 0.85,
      "etaMin": 3,
      "quoteFX": 1.0,
      "oracleFX": 1.0,
      "fxSpread": "0.0%",
      "liq": 8,
      "vol": 0.15,
      "status": "available",
      "amount": 50000,
      "amountOut": 49575.0
    }
  ],
  "fromNetwork": "ETHEREUM",
  "toNetwork": "BASE",
  "asset": "USDC",
  "amount": 50000
}
```

**Fields:**
- `rail`: Name of the routing provider
- `provider`: Type (bridge, stellar, tron, traditional)
- `score`: Computed routing score (0-100)
- `feePct`: Fee percentage (0.75 = 0.75%)
- `etaMin`: Estimated time of arrival in minutes
- `quoteFX`: FX rate quoted by the provider
- `oracleFX`: Oracle FX rate (reference)
- `fxSpread`: Difference between quote and oracle (percentage string)
- `liq`: Liquidity score (0-10)
- `vol`: Volatility score (0-1)
- `status`: "available" or "unavailable"
- `amount`: Input amount
- `amountOut`: Final amount after fees

---

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:34:56Z",
  "version": "1.0.0"
}
```

---

## Error Handling

**400 Bad Request:**
```json
{
  "error": "Invalid corridor",
  "message": "Unsupported corridor: ETHEREUM -> UNKNOWN"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to compute routes"
}
```

---

## Switching to Railway Backend

To enable the real Railway backend in the frontend:

1. Create `.env.local` file (NOT committed to Git):
```env
VITE_META_ROUTER_MODE=railway
VITE_META_ROUTER_URL=https://meta-router.railway.app
```

2. The frontend will automatically switch from GitHub simulation to Railway API.

3. Verify logs show: `🚂 Calling Railway Meta-Router API...`

---

## Development Notes

- The GitHub simulation mode is the default until Railway is deployed
- All frontend code is backend-agnostic and switches based on env vars
- The API contract matches the existing simulation data structure for seamless migration
