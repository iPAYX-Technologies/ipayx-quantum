# @ipayx/sdk - TypeScript SDK

Official TypeScript SDK for iPayX Protocol.

## Installation

```bash
npm install @ipayx/sdk
```

## Quick Start

```typescript
import { IpayxClient } from '@ipayx/sdk';

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

## API Reference

### `quote(request: QuoteRequest): Promise<QuoteResponse>`

Get optimal routes for a cross-border payment.

**Parameters:**
- `from` (string): Source currency code (e.g., 'USD')
- `to` (string): Destination currency code (e.g., 'CAD')
- `amount` (number): Amount to send
- `kyc` (boolean, optional): Whether KYC is required

**Returns:** Array of routes sorted by score (best first)

### `execute(request: ExecuteRequest): Promise<ExecuteResponse>`

Execute a payment using a selected route.

**Parameters:**
- `routeId` (string): Rail name from quote response
- `sourceAccount` (string): Source account identifier
- `destAccount` (string): Destination account identifier
- `amount` (number): Amount to send

**Returns:** Payment ID and status

### `getPayment(paymentId: string): Promise<PaymentStatus>`

Get payment status by ID.

### `metrics(): Promise<MetricsResponse>`

Get platform-wide metrics.

### `status(): Promise<StatusResponse>`

Check API health status.

## Error Handling

```typescript
try {
  const quote = await client.quote({ from: 'USD', to: 'CAD', amount: 10000 });
} catch (error) {
  console.error('API error:', error.message);
}
```

## Support

- Documentation: https://ipayx.ai/docs
- API Reference: https://ipayx.ai/docs/api
- GitHub: https://github.com/ipayx/sdk-typescript
