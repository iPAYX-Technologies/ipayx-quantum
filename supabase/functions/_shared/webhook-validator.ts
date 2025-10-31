export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === signature;
}

/**
 * Validates webhook timestamp to prevent replay attacks
 * @param timestamp - Unix timestamp in milliseconds
 * @param toleranceMs - Tolerance window (default: 5 minutes)
 */
export function isTimestampValid(timestamp: number, toleranceMs = 300000): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) <= toleranceMs;
}
