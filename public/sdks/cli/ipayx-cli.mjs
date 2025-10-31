#!/usr/bin/env node

/**
 * iPayX CLI
 * Command-line interface for iPayX Protocol
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const API_BASE = process.env.IPAYX_API_URL || 'https://api.ipayx.ai';
const API_KEY = process.env.IPAYX_TOKEN;

async function request(endpoint, options = {}) {
  if (!API_KEY) {
    console.error('Error: IPAYX_TOKEN environment variable not set');
    console.error('Usage: export IPAYX_TOKEN=ipx_live_xxx');
    process.exit(1);
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  return response.json();
}

async function quote(from, to, amount, kyc) {
  const data = await request('/v1/quotes', {
    method: 'POST',
    body: JSON.stringify({
      from,
      to,
      amount: parseFloat(amount),
      kyc: kyc === 'true',
    }),
  });

  console.log(`\n📊 Quote for ${from} → ${to} (${amount})\n`);
  console.log(`Corridor: ${data.corridor}`);
  console.log(`\n🏆 Top Routes:\n`);

  data.routes.forEach((route, i) => {
    console.log(`${i + 1}. ${route.rail}`);
    console.log(`   Score: ${route.score}`);
    console.log(`   Fee: ${(route.feePct * 100).toFixed(2)}%`);
    console.log(`   ETA: ${route.etaMin} min`);
    console.log(`   FX: ${route.quoteFX} (spread: ${route.fxSpread})`);
    console.log('');
  });
}

async function execute(routeId, sourceAccount, destAccount, amount) {
  const data = await request('/v1/execute', {
    method: 'POST',
    body: JSON.stringify({
      routeId,
      sourceAccount,
      destAccount,
      amount: parseFloat(amount),
    }),
  });

  console.log('\n✅ Payment initiated\n');
  console.log(`Payment ID: ${data.paymentId}`);
  console.log(`Status: ${data.status}`);
  console.log(`ETA: ${data.estimatedCompletionTime}`);
}

async function payment(paymentId) {
  const data = await request(`/v1/payments/${paymentId}`);

  console.log(`\n📦 Payment ${paymentId}\n`);
  console.log(`Status: ${data.status}`);
  console.log(`Amount: ${data.amount} ${data.from} → ${data.to}`);
  console.log(`Created: ${data.createdAt}`);
  if (data.completedAt) {
    console.log(`Completed: ${data.completedAt}`);
  }
  if (data.txHash) {
    console.log(`TX Hash: ${data.txHash}`);
  }
}

async function metrics() {
  const data = await request('/v1/metrics');

  console.log('\n📈 Platform Metrics\n');
  console.log(`24h Volume: $${data.totalVolume24h.toLocaleString()}`);
  console.log(`24h Transactions: ${data.totalTransactions24h.toLocaleString()}`);
  console.log(`Average Fee: ${(data.averageFee * 100).toFixed(2)}%`);
  console.log(`Average ETA: ${data.averageEta} min`);
  console.log(`Active Corridors: ${data.activeCorridors}`);
}

async function status() {
  const data = await request('/status');

  console.log('\n🟢 API Status\n');
  console.log(`Status: ${data.status}`);
  console.log(`Uptime: ${Math.floor(data.uptime / 60)} minutes`);
  console.log(`Version: ${data.version}`);
}

function printHelp() {
  console.log(`
iPayX CLI - Command-line interface for iPayX Protocol

Usage:
  ipayx-cli <command> [options]

Commands:
  quote <from> <to> <amount> [kyc]    Get payment quote
  execute <routeId> <src> <dst> <amt> Execute payment
  payment <paymentId>                 Get payment status
  metrics                             Get platform metrics
  status                              Check API health
  help                                Show this help

Environment:
  IPAYX_TOKEN     API key (required)
  IPAYX_API_URL   API base URL (default: https://api.ipayx.ai)

Examples:
  export IPAYX_TOKEN=ipx_live_xxx
  ipayx-cli quote USD CAD 10000
  ipayx-cli execute stellar-sep24 src_123 dst_456 10000
  ipayx-cli payment pmt_abc123
  ipayx-cli metrics
  ipayx-cli status
`);
}

// Main CLI router
const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case 'quote':
      if (args.length < 3) {
        console.error('Usage: ipayx-cli quote <from> <to> <amount> [kyc]');
        process.exit(1);
      }
      await quote(...args);
      break;

    case 'execute':
      if (args.length < 4) {
        console.error('Usage: ipayx-cli execute <routeId> <src> <dst> <amount>');
        process.exit(1);
      }
      await execute(...args);
      break;

    case 'payment':
      if (args.length < 1) {
        console.error('Usage: ipayx-cli payment <paymentId>');
        process.exit(1);
      }
      await payment(args[0]);
      break;

    case 'metrics':
      await metrics();
      break;

    case 'status':
      await status();
      break;

    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
}
