# iPayX CLI

Command-line interface for iPayX Protocol.

## Installation

```bash
npm install -g ipayx-cli
```

Or use directly with npx:

```bash
npx ipayx-cli help
```

## Setup

Set your API key:

```bash
export IPAYX_TOKEN=ipx_live_xxx
```

## Commands

### Get Quote

```bash
ipayx-cli quote USD CAD 10000
```

Output:
```
📊 Quote for USD → CAD (10000)

Corridor: USD-CAD

🏆 Top Routes:

1. stellar-sep24
   Score: 8.5
   Fee: 0.70%
   ETA: 3 min
   FX: 1.35 (spread: 0.02)
```

### Execute Payment

```bash
ipayx-cli execute stellar-sep24 src_account_123 dst_account_456 10000
```

### Check Payment Status

```bash
ipayx-cli payment pmt_abc123
```

### Get Metrics

```bash
ipayx-cli metrics
```

### Check API Status

```bash
ipayx-cli status
```

## Configuration

Environment variables:
- `IPAYX_TOKEN` - Your API key (required)
- `IPAYX_API_URL` - API base URL (default: https://api.ipayx.ai)

## Support

- Documentation: https://ipayx.ai/docs
- GitHub: https://github.com/ipayx/cli
