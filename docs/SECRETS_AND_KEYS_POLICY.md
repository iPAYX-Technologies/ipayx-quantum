# iPayX Quantum - Secrets and Keys Policy

## Overview

This document defines the definitive policy for managing secrets, API keys, and sensitive configuration in the iPayX Quantum application. **Never commit secrets to version control.**

## Core Principles

- **Never commit secrets** to Git repositories (public or private)
- **Always use environment variables** via `process.env` for runtime secrets
- **Use `.env.local` for local development** (Git-ignored)
- **Use CI/CD secrets management** for production deployments
- **Rotate secrets regularly** (30-90 days for high-privilege keys)
- **Implement principle of least privilege** (minimal scopes/permissions)

## Environment Variable Management

### Local Development

1. **Create `.env.local`** in the project root (this file is Git-ignored)
2. **Never commit** `.env.local` to version control
3. **Copy from `.env.example`** as a template
4. **Fill in actual values** for your local development environment

```bash
# Copy the example file
cp .env.example .env.local

# Edit with your local secrets
nano .env.local
```

### Production/Staging

1. **Use platform-specific secrets management:**
   - **Supabase**: Use `supabase secrets set` command
   - **Vercel**: Environment Variables in dashboard
   - **AWS**: AWS Secrets Manager or Parameter Store
   - **Docker**: Use secrets or env files with restricted permissions

2. **Never expose secrets in:**
   - Build logs
   - Error messages
   - Client-side code (unless prefixed with `VITE_` and intended for public)
   - API responses

## Required Environment Variables

### Supabase Configuration

```bash
# Frontend (public, safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...

# Backend only (NEVER expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### Plaid Integration

```bash
# Plaid API credentials
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox  # or development, production
```

### On/Off-Ramp Providers

```bash
# Cybrid
CYBRID_API_KEY=your_cybrid_api_key
CYBRID_BASE_URL=https://api.cybrid.xyz

# NDAX
NDAX_API_KEY=your_ndax_api_key
NDAX_BASE_URL=https://api.ndax.io

# Transak
TRANSAK_API_KEY=your_transak_api_key
TRANSAK_BASE_URL=https://api.transak.com
```

### Email/SMTP Configuration

```bash
# SMTP settings for email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_specific_password
SMTP_FROM="iPayX Quantum <noreply@ipayx.ai>"
```

## Code Usage Examples

### ✅ Correct: Using process.env

```typescript
// Backend/Edge Function - Supabase client with service role
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

```typescript
// Frontend - Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### ❌ Incorrect: Hardcoded secrets

```typescript
// NEVER DO THIS
const apiKey = 'sk_live_abc123xyz456';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### ✅ Correct: Plaid integration

```typescript
// supabase/functions/plaid-link/index.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);
```

### ✅ Correct: SMTP email sending

```typescript
// supabase/functions/send-email/index.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: recipient,
  subject: 'Welcome to iPayX Quantum',
  html: emailBody,
});
```

## Secret Rotation Policy

### High-Privilege Keys (Rotate every 30 days)
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLAID_SECRET`
- Database credentials
- Payment provider API keys

### Medium-Privilege Keys (Rotate every 60 days)
- SMTP credentials
- Analytics API keys
- Third-party service keys

### Low-Privilege Keys (Rotate every 90 days)
- Read-only API keys
- Public-facing publishable keys (Supabase anon key)

### Rotation Process

1. **Generate new key** in the provider's dashboard
2. **Update in all environments** (dev, staging, production)
3. **Deploy updated configuration**
4. **Verify functionality**
5. **Revoke old key** after 24-hour grace period
6. **Document rotation** in audit log

## Git Security

### .gitignore Requirements

Ensure the following are Git-ignored:

```
# Environment files
.env
.env.local
.env.*.local
*.env

# Secrets and keys
secrets/
keys/
*.key
*.pem
*.p12
*.pfx

# Config with secrets
config/secrets.json
config/credentials.json
```

### Committed Files

- ✅ `.env.example` - Template with placeholder values
- ✅ `docs/SECRETS_AND_KEYS_POLICY.md` - This document
- ❌ `.env` - Actual secrets
- ❌ `.env.local` - Local secrets
- ❌ Any file containing actual keys/passwords

## CI/CD Secrets Management

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
env:
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

### Supabase Edge Functions

```bash
# Set secrets for edge functions
supabase secrets set PLAID_CLIENT_ID=your_client_id --project-ref your-project-ref
supabase secrets set PLAID_SECRET=your_secret --project-ref your-project-ref
supabase secrets set SMTP_HOST=smtp.gmail.com --project-ref your-project-ref
supabase secrets set SMTP_PASS=your_password --project-ref your-project-ref
```

### Vercel/Netlify

1. Navigate to Project Settings → Environment Variables
2. Add each secret individually
3. Specify environment (Production, Preview, Development)
4. Mark sensitive variables as "Secret"

## Security Incident Response

### If a Secret is Compromised

1. **Immediate Action** (within 15 minutes):
   - Revoke the compromised key immediately
   - Generate and deploy a new key
   - Verify all services are using the new key

2. **Investigation** (within 1 hour):
   - Review audit logs for unauthorized access
   - Identify scope of potential breach
   - Check for data exfiltration

3. **Communication** (within 24 hours):
   - Notify security team
   - Document incident in security log
   - If customer data affected, prepare disclosure

4. **Post-Mortem** (within 1 week):
   - Document how compromise occurred
   - Implement preventive measures
   - Update policies and procedures

### If a Secret is Accidentally Committed

1. **Do NOT simply delete the commit** - history remains in Git
2. **Revoke the secret immediately**
3. **Generate a new secret**
4. **If public repository:**
   - Consider the secret fully compromised
   - Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
   - Force push (destructive operation)
   - Notify all contributors

## Compliance and Audit

### Audit Log Requirements

Maintain logs of:
- Secret creation dates
- Last rotation dates
- Access patterns
- Failed authentication attempts
- Secret revocations

### Compliance Checklist

- [ ] All production secrets are stored in secure vaults
- [ ] No secrets in version control
- [ ] `.env.example` is up-to-date with all required variables
- [ ] CI/CD pipelines use secure secret injection
- [ ] Rotation schedule is documented and followed
- [ ] Team members have access only to secrets they need
- [ ] Secrets are never logged or exposed in error messages
- [ ] Regular security audits are conducted

## Team Access Control

### Principle of Least Privilege

- **Developers**: Access to development/sandbox keys only
- **DevOps/SRE**: Access to all environments, rotation capabilities
- **Security Team**: Read-only audit access to all secrets
- **Third-party contractors**: No direct secret access, use scoped tokens

### Onboarding New Team Members

1. Provide `.env.example` template
2. Grant access to development secrets only
3. Document which secrets they need access to
4. Review access after 30 days

### Offboarding Team Members

1. Immediately revoke all secret access
2. Rotate any secrets they had access to
3. Remove from CI/CD secret access lists
4. Audit recent activity for anomalies

## Tools and Resources

### Recommended Tools

- **Secret scanning**: GitHub Secret Scanning, GitGuardian, TruffleHog
- **Secret management**: HashiCorp Vault, AWS Secrets Manager, Doppler
- **Environment management**: direnv, dotenv
- **Rotation automation**: Cloud provider native tools

### Additional Resources

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-03  
**Next Review**: 2025-12-03  
**Owner**: Security Team
