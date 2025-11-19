import { NextRequest, NextResponse } from "next/server";

const DRY = process.env.DRY_RUN === "true";

async function circleCctpTransfer(destinationChain: string, amountUSDC: number, address: string) {
  if (DRY) {
    // Deterministic stub transaction
    return {
      id: "stub-cctp-circle",
      destination_chain: destinationChain,
      amount: amountUSDC,
      destination_address: address,
      tx: "stub-cctp",
      status: "queued"
    };
  }
  const res = await fetch("https://api.circle.com/v1/cctp/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination_chain: destinationChain, amount: amountUSDC, destination_address: address })
  });
  const data = await res.json().catch(() => ({}));
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { destinationChain, amountUSDC, address } = await req.json();
    const cctp = await circleCctpTransfer(String(destinationChain), Number(amountUSDC), String(address));
    return NextResponse.json({ ok: true, provider: "Circle", cctp }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "bad_request" }, { status: 400 });
  }
}
