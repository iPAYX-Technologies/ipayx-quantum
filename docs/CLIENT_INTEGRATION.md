# Client Integration Guide

Complete guide for integrating iPayX Protocol into your application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [TypeScript SDK](#typescript-sdk)
3. [Python SDK](#python-sdk)
4. [CLI](#cli)
5. [Embeddable Widget](#embeddable-widget)
6. [Smart Contract Integration](#smart-contract-integration)
7. [API Reference](#api-reference)
8. [Authentication](#authentication)

## Quick Start

Choose your integration method:

- **TypeScript/JavaScript Apps** → Use the TypeScript SDK
- **Python Apps** → Use the Python SDK
- **Quick Testing** → Use the CLI
- **Website Embed** → Use the Widget
- **dApp On-chain Correlation** → Use the Smart Contract

## TypeScript SDK

### Installation

```bash
npm install @ipayx/sdk
```

### Basic Usage

```typescript
import { IpayxClient } from '@ipayx/sdk';

// Initialize client with your API key
const client = new IpayxClient('ipx_live_xxx');

// Get a quote
const quote = await client.quote({
  from: 'USD',
  to: 'CAD',
  amount: 10000,
  kyc: false
});

console.log('Best route:', quote.routes[0]);

// Execute payment
const payment = await client.execute({
  routeId: quote.routes[0].rail,
  sourceAccount: 'src_account_123',
  destAccount: 'dst_account_456',
  amount: 10000
});

console.log('Payment ID:', payment.paymentId);

// Check payment status
const status = await client.getPayment(payment.paymentId);
console.log('Status:', status.status);
```

### Full API

- `quote(request)` - Get optimal routes
- `execute(request)` - Execute payment
- `getPayment(id)` - Get payment status
- `metrics()` - Get platform metrics
- `status()` - Check API health

[Full TypeScript SDK documentation →](../public/sdks/typescript/README.md)

## Python SDK

### Installation

```bash
pip install ipayx
```

### Basic Usage

```python
from ipayx import IpayxClient

# Initialize client
client = IpayxClient('ipx_live_xxx')

# Get quote
quote = client.quote(
    from_currency='USD',
    to_currency='CAD',
    amount=10000
)

# Execute payment
payment = client.execute(
    route_id=quote['routes'][0]['rail'],
    source_account='src_account_123',
    dest_account='dst_account_456',
    amount=10000
)

# Check status
status = client.get_payment(payment['paymentId'])
```

[Full Python SDK documentation →](../public/sdks/python/README.md)

## CLI

### Installation

```bash
npm install -g ipayx-cli
```

Or use with npx:

```bash
npx ipayx-cli help
```

### Setup

```bash
export IPAYX_TOKEN=ipx_live_xxx
```

### Commands

```bash
# Get quote
ipayx-cli quote USD CAD 10000

# Execute payment
ipayx-cli execute stellar-sep24 src_123 dst_456 10000

# Check payment status
ipayx-cli payment pmt_abc123

# Get metrics
ipayx-cli metrics

# Check API status
ipayx-cli status
```

[Full CLI documentation →](../public/sdks/cli/README.md)

## Embeddable Widget

Add the iPayX quote widget to any website.

### Installation

```html
<!-- Add the widget HTML -->
<iframe src="https://ipayx.ai/sdks/widget/ipayx_widget.html" width="100%" height="600"></iframe>

<!-- Configure API token -->
<script>
  window.IPAYX_TOKEN = 'ipx_live_xxx';
</script>
```

### Features

- No dependencies
- Minimal styling (easy to customize)
- Handles quote requests
- Displays top 3 routes
- Mobile responsive

### Customization

The widget uses minimal inline styles. You can override them:

```html
<style>
  .ipayx-widget {
    font-family: 'Your Custom Font';
  }
  .ipayx-button {
    background: #your-color;
  }
</style>
```

## Smart Contract Integration

For dApps that need to correlate on-chain events with off-chain iPayX payments.

### Contract Address

- **Ethereum Mainnet**: `TBD`
- **Polygon**: `TBD`
- **Arbitrum**: `TBD`
- **Base**: `TBD`

### Source Code

[IpayxRegistry.sol](../public/contracts/IpayxRegistry.sol)

### Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IpayxRegistry.sol";

contract MyDapp {
    IpayxRegistry public registry;

    constructor(address _registryAddress) {
        registry = IpayxRegistry(_registryAddress);
    }

    function processPayment(string calldata paymentId) external {
        // Reference the off-chain payment on-chain
        registry.referencePayment(paymentId);
        
        // Now you have a verifiable on-chain record
        // that msg.sender initiated this payment
        
        // Your business logic here...
    }

    function verifyPayment(string calldata paymentId, address user) 
        external 
        view 
        returns (bool) 
    {
        return registry.verifyPayer(paymentId, user);
    }
}
```

### Key Features

- **Payment References**: Create on-chain records of off-chain payments
- **Verification**: Verify who initiated a payment
- **Event Emission**: Listen for `PaymentReferenced` events
- **Gas Efficient**: Minimal storage, optimized for low gas costs

### Important Notes

⚠️ **This contract does NOT handle funds.** It only creates verifiable references.

Use cases:
- Prove that a user initiated an iPayX payment
- Correlate smart contract events with payment webhooks
- Build on-chain logic triggered by off-chain payment confirmation

## API Reference

### Base URL

```
https://api.ipayx.ai
```

### Authentication

All requests require a Bearer token:

```bash
Authorization: Bearer ipx_live_xxx
```

### Endpoints

#### POST /v1/quotes

Get optimal payment routes.

**Request:**
```json
{
  "from": "USD",
  "to": "CAD",
  "amount": 10000,
  "kyc": false
}
```

**Response:**
```json
{
  "routes": [
    {
      "rail": "stellar-sep24",
      "score": 8.5,
      "feePct": 0.007,
      "etaMin": 3,
      "quoteFX": 1.35,
      "oracleFX": 1.34,
      "fxSpread": 0.01,
      "liq": 9,
      "vol": 0.8,
      "status": "live"
    }
  ],
  "corridor": "USD-CAD",
  "amount": 10000
}
```

#### POST /v1/execute

Execute a payment.

**Request:**
```json
{
  "routeId": "stellar-sep24",
  "sourceAccount": "src_account_123",
  "destAccount": "dst_account_456",
  "amount": 10000
}
```

**Response:**
```json
{
  "paymentId": "pmt_abc123",
  "status": "pending",
  "estimatedCompletionTime": "2025-01-15T10:30:00Z"
}
```

#### GET /v1/payments/:id

Get payment status.

**Response:**
```json
{
  "id": "pmt_abc123",
  "status": "completed",
  "amount": 10000,
  "from": "USD",
  "to": "CAD",
  "createdAt": "2025-01-15T10:25:00Z",
  "completedAt": "2025-01-15T10:28:00Z",
  "txHash": "0xabc..."
}
```

#### GET /v1/metrics

Get platform metrics.

**Response:**
```json
{
  "totalVolume24h": 1500000,
  "totalTransactions24h": 450,
  "averageFee": 0.008,
  "averageEta": 4,
  "activeCorridors": 12
}
```

#### GET /status

Check API health.

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Authentication

### Getting an API Key

1. Sign up at [ipayx.ai/signup](https://ipayx.ai/signup)
2. Navigate to Settings → API Keys
3. Create a new API key
4. Copy the key (starts with `ipx_live_` for production or `ipx_test_` for sandbox)

### Using the API Key

**TypeScript:**
```typescript
const client = new IpayxClient('ipx_live_xxx');
```

**Python:**
```python
client = IpayxClient('ipx_live_xxx')
```

**CLI:**
```bash
export IPAYX_TOKEN=ipx_live_xxx
```

**HTTP:**
```bash
curl https://api.ipayx.ai/status \
  -H "Authorization: Bearer ipx_live_xxx"
```

### Sandbox vs Production

- **Sandbox**: `ipx_test_xxx` - Use for testing, no real transactions
- **Production**: `ipx_live_xxx` - Live payments with real money

## Support

- **Documentation**: https://ipayx.ai/docs
- **API Reference**: https://ipayx.ai/docs/api
- **OpenAPI Spec**: https://ipayx.ai/openapi.yaml
- **Postman Collection**: [Download](../docs/postman/ipayx_collection_v1.json)
- **Discord**: https://discord.gg/ipayx
- **Email**: support@ipayx.ai

## Error Handling

All SDKs throw/return errors in the same format:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Amount must be greater than 0",
    "field": "amount"
  }
}
```

Common error codes:
- `invalid_request` - Invalid parameters
- `authentication_failed` - Invalid API key
- `rate_limit_exceeded` - Too many requests
- `payment_failed` - Payment execution failed
- `insufficient_liquidity` - Route not available
