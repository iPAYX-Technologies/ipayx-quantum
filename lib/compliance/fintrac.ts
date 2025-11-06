// lib/compliance/fintrac.ts
// FINTRAC ECTR XML builder (Node/TS; no external deps). DRY_RUN-safe.

import fs from "node:fs";
import path from "node:path";

export type FintracKyc = {
  sender_name: string;
  address: string;
  dob: string; // YYYY-MM-DD
};

function xmlEscape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildFintracEctrXml(
  senderId: string,
  amountCad: number,
  receiverCountry: string,
  kyc: FintracKyc,
  addComment?: string
): string {
  const today = new Date().toISOString().slice(0, 10);
  const comment = addComment ? `  <!-- ${xmlEscape(addComment)} -->\n` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<ECTR>\n${comment}  <TransactionDate>${today}</TransactionDate>\n  <Amount>${amountCad}</Amount>\n  <SenderName>${xmlEscape(kyc.sender_name || "")}</SenderName>\n  <SenderID>${xmlEscape(senderId)}</SenderID>\n  <SenderAddress>${xmlEscape(kyc.address || "")}</SenderAddress>\n  <SenderDOB>${xmlEscape(kyc.dob || "")}</SenderDOB>\n  <ReceiverCountry>${xmlEscape(receiverCountry)}</ReceiverCountry>\n</ECTR>\n`;
}

export function safeFileName(senderId: string): string {
  return String(senderId || "sender").replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function writeFintracFile(xml: string, senderId: string): { fileName: string; absPath: string } {
  const base = `ectr_report_${safeFileName(senderId)}_${new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}.xml`;
  const tmpDir = fs.existsSync("/tmp") ? "/tmp/fintrac" : path.join(process.cwd(), ".tmp", "fintrac");
  fs.mkdirSync(tmpDir, { recursive: true });
  const absPath = path.join(tmpDir, base);
  fs.writeFileSync(absPath, xml, { encoding: "utf-8" });
  return { fileName: base, absPath };
}

export function generateAndSaveFintracEctr(params: {
  senderId: string;
  amountCad: number;
  receiverCountry: string;
  kyc: FintracKyc;
  dryRun?: boolean;
}) {
  const { senderId, amountCad, receiverCountry, kyc, dryRun = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false" } =
    params;
  const xml = buildFintracEctrXml(senderId, amountCad, receiverCountry, kyc, dryRun ? "DRY_RUN — not submitted" : undefined);
  const saved = writeFintracFile(xml, senderId);
  return { ok: true, dryRun, file: saved, xml };
}