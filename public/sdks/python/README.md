# iPayX Python SDK

Official Python SDK for iPayX Protocol.

## Installation

```bash
pip install ipayx
```

## Quick Start

```python
from ipayx import IpayxClient

# Initialize client
client = IpayxClient('ipx_live_xxx')

# Get a quote
quote = client.quote(
    from_currency='USD',
    to_currency='CAD',
    amount=10000
)

print(f"Best route: {quote['routes'][0]}")

# Execute payment
payment = client.execute(
    route_id=quote['routes'][0]['rail'],
    source_account='src_account_123',
    dest_account='dst_account_456',
    amount=10000
)

print(f"Payment ID: {payment['paymentId']}")

# Check payment status
status = client.get_payment(payment['paymentId'])
print(f"Status: {status['status']}")
```

## API Reference

### `IpayxClient(api_key, base_url='https://api.ipayx.ai')`

Initialize the client with your API key.

### `quote(from_currency, to_currency, amount, kyc=None)`

Get optimal routes for a cross-border payment.

**Parameters:**
- `from_currency` (str): Source currency code
- `to_currency` (str): Destination currency code
- `amount` (float): Amount to send
- `kyc` (bool, optional): Whether KYC is required

**Returns:** Dictionary with routes sorted by score

### `execute(route_id, source_account, dest_account, amount)`

Execute a payment using a selected route.

**Returns:** Dictionary with payment ID and status

### `get_payment(payment_id)`

Get payment status by ID.

### `metrics()`

Get platform-wide metrics.

### `status()`

Check API health status.

## Error Handling

```python
try:
    quote = client.quote('USD', 'CAD', 10000)
except Exception as e:
    print(f"API error: {e}")
```

## Support

- Documentation: https://ipayx.ai/docs
- API Reference: https://ipayx.ai/docs/api
- GitHub: https://github.com/ipayx/sdk-python
