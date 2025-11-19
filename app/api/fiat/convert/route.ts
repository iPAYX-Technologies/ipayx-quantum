import { NextRequest, NextResponse } from "next/server";

const DRY = process.env.DRY_RUN === "true";

async function cybridQuote(amount: number) {
  if (DRY) {
    // Deterministic stub: 1 USDC = 1.34 CAD (example), returns quote-like payload
    return { id: "stub-quote-cybrid", side: "buy", symbol: "usdc_cad", amount, price: 1.34, total: amount * 1.34 };
  }
  const res = await fetch("https://bank.sandbox.cybrid.app/api/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ side: "buy", symbol: "usdc_cad", amount })
  });
  const data = await res.json().catch(() => ({}));
  return data;
}

async function ndaxTrade(amount: number) {
  if (DRY) {
    // Deterministic stub: sell USDC for CAD with price 1.33
    return { id: "stub-trade-ndax", instrumentId: "USDC_CAD", side: "sell", quantity: amount, price: 1.33, proceeds: amount * 1.33 };
  }
  const res = await fetch("https://api.ndax.io/api/v1/trade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrumentId: "USDC_CAD", side: "sell", quantity: amount })
  });
  const data = await res.json().catch(() => ({}));
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { from, to, amount } = await req.json();

    if (from === "CAD" && to === "USDC") {
      const quote = await cybridQuote(Number(amount));
      return NextResponse.json({ ok: true, provider: "Cybrid", quote }, { status: 200 });
    }

    if (from === "USDC" && to === "CAD") {
      const trade = await ndaxTrade(Number(amount));
      return NextResponse.json({ ok: true, provider: "NDAX", trade }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: "Unsupported pair" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "bad_request" }, { status: 400 });
  }
}
