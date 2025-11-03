# Secrets and Keys Policy — iPayX Quantum

## Overview
This document defines the definitive security policy for managing secrets, API keys, and sensitive configuration in iPayX Quantum. **All team members and contributors must follow these rules without exception.**

## Core Principles

### 1. Never Commit Secrets to Version Control
- **NEVER** commit API keys, passwords, tokens, or any sensitive data to Git
- **NEVER** commit `.env.local` or any file containing real secrets
- Always use `.env.example` with placeholder values for documentation
- Use `.gitignore` to prevent accidental commits of sensitive files

### 2. Use Environment Variables for All Secrets
- Store all sensitive configuration in environment variables
- Access secrets via `process.env` in Node.js/backend code
- Use `import.meta.env` for Vite frontend environment variables
- Prefix client-side environment variables with `VITE_` in Vite projects

### 3. Separate Public and Private Keys
- **Public keys** (prefixed with `VITE_`): Safe to expose to the browser
  - Examples: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Private keys** (NO prefix): Must remain server-side only
  - Examples: `SUPABASE_SERVICE_ROLE`, `PLAID_SECRET`, `SMTP_PASS`

### 4. Use CI/CD Secrets Management
- Store production secrets in CI/CD platform (GitHub Actions secrets, Vercel env vars)
- Never hardcode secrets in workflow files
- Use secret scanning tools to detect accidental exposures

### 5. Rotate Keys Regularly
- Rotate API keys every 90 days minimum
- Immediately rotate any key that may have been exposed
- Document rotation dates and maintain key version history

## File Management Rules

### Files That Must Be Git-Ignored
✅ **ALWAYS** in `.gitignore`:
- `.env.local` - Your local development secrets
- `.env.production.local` - Production environment secrets
- `.env.development.local` - Development environment secrets
- `*.env.local` - Any local environment files
- Any file containing actual API keys or passwords

### Files That Should Be Committed
✅ Safe to commit:
- `.env.example` - Template with placeholder values
- `docs/SECRETS_AND_KEYS_POLICY.md` - This policy document
- Configuration files with no secrets

### Hardened .gitignore Example
```gitignore
# Environment files with secrets
.env.local
.env.*.local
.env.production
.env.development

# Keep example file
!.env.example

# Backup files that might contain secrets
*.backup
*.bak
*.key
*.pem
*.cert
```

## Environment Variable Naming Convention

### Backend/Server-Side Variables (No VITE_ prefix)
```bash
# Plaid API
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox

# Supabase Service Role (NEVER expose to client)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key

# Payment Processors
CYBRID_API_KEY=your_cybrid_key
NDAX_API_KEY=your_ndax_key
TRANSAK_API_KEY=your_transak_key

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@ipayx.com
```

### Frontend/Client-Side Variables (VITE_ prefix required)
```bash
# Supabase Public Keys (Safe for client)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Public API endpoints
VITE_API_BASE_URL=https://api.ipayx.com
```

## Code Implementation Examples

### ✅ Correct: Using Environment Variables with Supabase

#### Server-Side (Node.js/Edge Functions)
```typescript
import { createClient } from '@supabase/supabase-js';

// Using service role for admin operations (server-side only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Example: Secure user creation
export async function createUserWithRole(email: string, role: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role }
  });
  
  return { data, error };
}
```

#### Client-Side (React/Vite)
```typescript
import { createClient } from '@supabase/supabase-js';

// Using public keys for client operations
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Example: Client authentication
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}
```

### ✅ Correct: Plaid Integration
```typescript
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

// Server-side Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
```

### ❌ Incorrect: Hardcoded Secrets
```typescript
// NEVER DO THIS!
const supabase = createClient(
  'https://xxxxx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Hardcoded secret
);

// NEVER DO THIS!
const apiKey = 'sk_live_abc123xyz789'; // Hardcoded API key
```

## CI/CD Configuration

### GitHub Actions Secrets
Configure these in repository settings → Secrets and variables → Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_SERVICE_ROLE: ${{ secrets.SUPABASE_SERVICE_ROLE }}
      PLAID_CLIENT_ID: ${{ secrets.PLAID_CLIENT_ID }}
      PLAID_SECRET: ${{ secrets.PLAID_SECRET }}
```

### Vercel Environment Variables
Configure in Vercel Dashboard → Project Settings → Environment Variables:
- Set "Production" variables for production deployments
- Set "Preview" variables for PR preview deployments
- Use different keys for preview vs. production

## Secret Detection and Prevention

### Pre-commit Hooks (Recommended)
```bash
# Install git-secrets
brew install git-secrets  # macOS
apt-get install git-secrets  # Ubuntu

# Setup hooks
git secrets --install
git secrets --register-aws
git secrets --add 'sk_live_[a-zA-Z0-9]+'
git secrets --add 'SUPABASE_SERVICE_ROLE'
```

### GitHub Secret Scanning
- Enable "Secret scanning" in repository settings
- Configure "Push protection" to block commits with secrets
- Review and remediate any detected secrets immediately

## Incident Response

### If a Secret is Exposed
1. **Immediately** rotate the exposed key
2. Revoke the old key in the service provider dashboard
3. Update the new key in all environments (local, CI/CD, production)
4. Review git history and remove exposed secrets if necessary
5. Check access logs for any unauthorized usage
6. Document the incident and remediation steps

### Removing Secrets from Git History
```bash
# Use git-filter-repo (recommended) or BFG Repo-Cleaner
git filter-repo --path .env.local --invert-paths
git push --force
```

## Local Development Setup

### Initial Setup
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your local development keys in `.env.local`

3. Verify `.env.local` is in `.gitignore`:
   ```bash
   git check-ignore .env.local  # Should output: .env.local
   ```

4. **Never** use production keys in local development

### Team Sharing (Secure Method)
- Use a secure password manager (1Password, LastPass) to share secrets
- Use encrypted communication channels
- Never share secrets via Slack, email, or other unsecured channels

## Compliance and Audit

### Regular Security Audits
- Monthly review of all API keys and access permissions
- Quarterly security audit of environment configuration
- Annual penetration testing including secret management

### Documentation Requirements
- Maintain inventory of all API keys and their purposes
- Document which services have access to which secrets
- Keep rotation schedule and history

## Key Providers and Setup

### Plaid
- Sandbox: For development and testing
- Production: Requires Plaid account verification
- Docs: https://plaid.com/docs/

### Supabase
- Project URL: Unique per project, safe to expose
- Anon/Publishable Key: Safe for client-side use
- Service Role Key: Server-side only, full database access

### Cybrid (On-ramp)
- Sandbox: https://api.demo.cybrid.xyz
- Production: https://api.cybrid.xyz
- Docs: https://docs.cybrid.xyz/

### NDAX (Exchange)
- API Key: Generated in NDAX account settings
- Production: https://api.ndax.io
- Docs: https://ndax.io/api

### Transak (On-ramp)
- API Key: From Transak dashboard
- Production: https://api.transak.com
- Docs: https://docs.transak.com/

### SMTP Configuration
- Use service like SendGrid, Mailgun, or AWS SES
- Always use TLS/SSL (port 465 or 587)
- Configure SPF, DKIM, and DMARC records

## Summary Checklist

Before every commit:
- [ ] No secrets in code files
- [ ] `.env.local` is git-ignored
- [ ] All secrets use `process.env` or `import.meta.env`
- [ ] Client-side env vars have `VITE_` prefix
- [ ] `.env.example` is up to date with placeholders
- [ ] No hardcoded API keys or passwords

Before production deployment:
- [ ] All production secrets configured in CI/CD
- [ ] Separate keys for production vs. development
- [ ] Secret scanning enabled
- [ ] Key rotation schedule documented
- [ ] Incident response plan in place

## Questions or Concerns?
Contact the security team or refer to:
- `docs/OVERNIGHT_BUILD_SCRIPT.md` for build procedures
- `.env.example` for required environment variables
- Repository security settings for secret scanning configuration
