# Security Implementation - iPayX Quantum Rail

## ✅ Security Checklist

### Database Security

**✅ Row-Level Security (RLS)**
- Toutes les tables ont RLS activé
- Policies granulaires par organisation/projet
- Function `has_api_scope()` pour éviter récursion RLS
- Isolation multi-tenant complète

**✅ API Keys**
- Préfixe `ipx_live_` pour clés production
- Préfixe `ipx_demo_` pour clés demo (readonly)
- Scopes granulaires : `quotes:read`, `routes:read`, `payments:write`, `webhooks:read`
- Rotation automatique supportée (`last_rotated_at`)

### Authentication

**✅ Supabase Auth**
- Email auto-confirmé (pour dev/staging)
- Password strength : À configurer manuellement via Supabase
- Session persistence : localStorage
- Auto-refresh tokens

**⚠️ À ACTIVER** : Leaked Password Protection
```
Accéder à : Supabase Dashboard → Authentication → Providers → Email
Activer : "Password strength and leaked password protection"
```

### API Security

**✅ Rate Limiting**
```typescript
/quotes   : 30 requests/minute
/execute  : 5 requests/minute
/payments : 10 requests/minute
```

**✅ Headers Sécurité**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; img-src 'self' data:; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

**✅ CORS**
```typescript
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### Webhooks

**✅ HMAC Signature Validation**
```typescript
// Tous les webhooks doivent être signés
validateWebhookSignature(payload, signature, secret)
```

**Webhook Endpoints**
- `payment.succeeded`
- `payment.failed`
- `kyc.required`
- `refund.started`

### Input Validation

**✅ Zod Schema Validation**
```typescript
// Toutes les entrées API sont validées
quoteSchema.safeParse(body)
```

**✅ Sanitization**
- Trim des strings
- Regex validation pour codes devise
- Min/max sur montants
- Protection injection SQL (via Supabase client)

## 🔐 Secrets Management

### Secrets actuels (Supabase)
```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ RESEND_API_KEY
✅ MESSARI_API_KEY
✅ LOVABLE_API_KEY
✅ SENDGRID_API_KEY
```

### À ajouter (OAuth)
```
⚠️ GOOGLE_CLIENT_ID
⚠️ GOOGLE_CLIENT_SECRET
⚠️ APPLE_CLIENT_ID
⚠️ APPLE_CLIENT_SECRET
⚠️ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
```

## 🛡️ Best Practices

### 1. API Key Storage
- **JAMAIS** en localStorage (accessible XSS)
- **TOUJOURS** côté serveur ou secure cookie (httpOnly, secure, sameSite)
- Rotation régulière (30-90 jours)

### 2. Scopes Minimaux
```typescript
// ❌ Mauvais
scopes: ['quotes:read', 'routes:read', 'payments:write', 'webhooks:read']

// ✅ Bon (principe du moindre privilège)
scopes: ['quotes:read'] // Uniquement ce qui est nécessaire
```

### 3. 2FA pour Actions Sensibles
```typescript
// Pour scope `payments:write`, 2FA OBLIGATOIRE
if (scopes.includes('payments:write')) {
  requireMFA();
}
```

### 4. Logging Sécurisé
```typescript
// ❌ Ne JAMAIS logger
console.log('API Key:', apiKey);
console.log('Password:', password);

// ✅ Logger uniquement
console.log('API Key validated', { keyId: key.id.substring(0, 8) });
```

## 🚨 Incident Response

### Si compromission API Key
1. Désactiver immédiatement : `UPDATE api_keys SET is_active = false WHERE key = '...'`
2. Notifier le user via email
3. Forcer rotation : Générer nouvelle clé
4. Audit logs : Vérifier `api_usage_logs` pour activité suspecte

### Si fuite de données
1. Identifier scope de la fuite
2. Révoquer tous les tokens affectés
3. Notifier users impactés
4. Audit complet RLS policies
5. Rapport incident

## 🔍 Security Monitoring

### Métriques à surveiller
- Taux de 429 (rate limit) par clé
- Tentatives auth échouées
- Scopes inhabituels demandés
- Volumes anormaux par projet
- Webhooks signature failures

### Alertes critiques
```typescript
// Alert si > 100 échecs auth en 5min
if (failedAuth > 100 && timeWindow < 300) {
  alert('Potential brute force attack');
}

// Alert si volume > 10x moyenne
if (volume24h > avgVolume * 10) {
  alert('Unusual volume spike');
}
```

## 📋 Compliance

### RGPD/GDPR
- ✅ Données minimales collectées (email, company, country)
- ✅ Droit à l'oubli : Cascade DELETE sur `organizations`
- ✅ Logs expiration : TTL 90 jours sur `api_usage_logs`
- ⚠️ À documenter : Politique de rétention

### PCI-DSS (si gestion cartes)
- ❌ Pas de stockage direct de données carte
- ✅ Délégation aux providers (Circle, Coinbase)
- ✅ Tokenization via providers

### SOC 2
- ✅ Audit logs complets
- ✅ Encryption at rest (Supabase)
- ✅ Encryption in transit (TLS 1.3)
- ⚠️ À implémenter : Backup/disaster recovery

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-policies)
- [JWT Security Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

**Version** : 1.0.0  
**Dernière revue** : 2025-10-16  
**Next review** : 2025-11-16
