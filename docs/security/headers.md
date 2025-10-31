# Security Headers

## Overview

iPayX API uses Supabase Edge Functions which automatically apply industry-standard security headers. This document outlines the security headers in place.

## Default Supabase Edge Function Headers

All Edge Functions automatically include:

### 1. Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
- Enforces HTTPS for 1 year
- Applies to all subdomains
- Prevents downgrade attacks

### 2. X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- Prevents MIME-type sniffing
- Blocks browser from interpreting files as different MIME types

### 3. X-Frame-Options
```
X-Frame-Options: DENY
```
- Prevents clickjacking attacks
- Blocks rendering in `<frame>`, `<iframe>`, `<embed>`, or `<object>`

### 4. Content-Security-Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```
- Mitigates XSS attacks
- Restricts resource loading to same origin

## CORS Configuration

Custom CORS headers are applied per function:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Production Recommendation**: Replace `*` with specific domain:
```typescript
'Access-Control-Allow-Origin': 'https://ipayx.ai',
```

## Rate Limiting Headers

Rate-limited endpoints return:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1697123456
```

## Security Headers Testing

Test your deployment with:
```bash
curl -I https://ggkymbeyesuodnoogzyb.supabase.co/functions/v1/status
```

Or use online tools:
- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Additional Headers (Optional)

For production proxy/CDN (Cloudflare Workers example):

```javascript
// See docs/security/cloudflare_headers_worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newResponse = new Response(response.body, response)
  
  newResponse.headers.set('X-XSS-Protection', '1; mode=block')
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  newResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  return newResponse
}
```

## Compliance

- **OWASP Top 10**: Headers mitigate A03:2021 (Injection) and A05:2021 (Security Misconfiguration)
- **PCI-DSS**: HSTS + TLS 1.2+ requirement met
- **SOC 2**: Security headers documented and enforced

## Monitoring

Verify headers in production:
```bash
# Check all security headers
curl -I https://api.ipayx.ai/v1/status | grep -E "(Strict-Transport|X-Content|X-Frame|Content-Security)"
```

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [Supabase Edge Functions Security](https://supabase.com/docs/guides/functions/security)
