import { checkIpRateLimit } from './ip-rate-limiter.ts';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

export async function rateLimit(
  req: Request, 
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  
  const result = await checkIpRateLimit(clientIP, config.identifier, config.maxRequests);
  
  if (!result.allowed) {
    const retryAfter = Math.ceil(config.windowMs / 1000);
    console.warn(`[RATE_LIMIT] IP ${clientIP} exceeded limit for ${config.identifier}`);
    return { 
      allowed: false, 
      remaining: 0,
      retryAfter 
    };
  }

  return { 
    allowed: true, 
    remaining: result.remaining 
  };
}
