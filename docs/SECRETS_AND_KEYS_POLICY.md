# Secrets and Keys Policy

This document outlines the definitive policy for managing secrets, API keys, and sensitive configuration data in the iPayX Quantum project.

## Core Principles

**NEVER commit secrets to git.** All sensitive data must be stored securely and accessed via environment variables.

## Rules and Best Practices

### 1. Environment File Management

- **`.env.local`**: Store all secrets and API keys in `.env.local` (local development only)
- **`.env.example`**: Commit this file with placeholder values to document required variables
- **`.env`**: Do NOT use this file for secrets; it may be committed accidentally
- **Git**: Ensure `.env.local` is in `.gitignore` and never committed

### 2. Accessing Environment Variables

**Always use environment variables (via `process.env` or `import.meta.env`):**

```typescript
// ✓ CORRECT: Using process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ✗ WRONG: Never hardcode secrets
const apiKey = "sk_live_abc123xyz"; // NEVER DO THIS
```

**For server-side secrets (service role keys, API secrets):**

```typescript
// Server-side code only (NOT exposed to browser)
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;
const plaidSecret = process.env.PLAID_SECRET;
```

**For client-side variables in Vite:**

- Prefix with `VITE_` to expose to browser
- Only expose public/publishable keys (never secret keys)

```typescript
// .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...  // Public key only

// In your code
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### 3. CI/CD and Production Secrets

**GitHub Actions / CI/CD:**

- Store secrets in GitHub repository settings → Secrets and variables → Actions
- Reference secrets in workflows using `${{ secrets.SECRET_NAME }}`
- Never log or echo secrets in CI/CD output

**Production Hosting (Vercel, Netlify, etc.):**

- Configure environment variables in platform settings
- Use separate values for development, staging, and production
- Enable secret masking/encryption features if available

### 4. Secret Rotation

- **Rotate secrets regularly** (quarterly at minimum)
- Rotate immediately if:
  - A secret is accidentally committed to git
  - A team member with access leaves
  - A security breach is suspected
- Document rotation dates and maintain history securely

### 5. Secret Scope and Access

**Public vs. Private:**

- **Public keys**: Can be exposed to client-side code (Supabase anon key, Plaid Link token)
- **Secret keys**: Must remain server-side only (Supabase service role, Plaid secret)

**Team Access:**

- Limit access to production secrets to essential personnel only
- Use role-based access control (RBAC) where possible
- Document who has access to which secrets

## Example: Supabase Client Setup

### ❌ Incorrect (Hardcoded)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://abcdefgh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);
```

### ✅ Correct (Using Environment Variables)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Required Environment Variables

Refer to `.env.example` in the repository root for a complete list of required environment variables. Each variable should be documented with:

- Variable name
- Description of purpose
- Example value (placeholder or format)
- Whether it's required or optional
- Whether it's client-side (VITE_ prefix) or server-side

## Secret Types in iPayX Quantum

### Database & Authentication
- `VITE_SUPABASE_URL`: Supabase project URL (public)
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon/public key (public)
- `SUPABASE_SERVICE_ROLE`: Supabase service role key (SECRET - server-side only)

### Banking Integration
- `PLAID_CLIENT_ID`: Plaid client identifier (can be public)
- `PLAID_SECRET`: Plaid API secret (SECRET - server-side only)
- `PLAID_ENV`: Plaid environment (sandbox/development/production)

### On/Off-Ramp Providers
- `CYBRID_API_KEY`: Cybrid API key (SECRET)
- `NDAX_API_KEY`: NDAX API key (SECRET)
- `TRANSAK_API_KEY`: Transak API key (SECRET)

### Email/SMTP
- `SMTP_HOST`: Mail server hostname
- `SMTP_PORT`: Mail server port
- `SMTP_USER`: Mail authentication username
- `SMTP_PASS`: Mail authentication password (SECRET)

## Security Incident Response

If a secret is compromised:

1. **Immediately revoke** the compromised secret from the provider's dashboard
2. **Generate a new secret** and update it in all necessary locations
3. **Remove from git history** if accidentally committed (use `git filter-branch` or BFG Repo-Cleaner)
4. **Notify the team** via appropriate communication channels
5. **Document the incident** and update security procedures if needed

## Audit Checklist

Before each deployment, verify:

- [ ] No secrets in source code (run: `git grep -n "SECRET\|KEY\|PASSWORD" -- '*.ts' '*.tsx' '*.js' '*.jsx'`)
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.example` is up to date with all required variables
- [ ] Production environment variables are set in hosting platform
- [ ] All secrets use `process.env` / `import.meta.env` access
- [ ] No secrets logged to console or error messages
- [ ] Secret rotation schedule is up to date

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Plaid Security](https://plaid.com/docs/api/security/)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Questions or Concerns

If you're unsure whether something is a secret or how to handle it:

1. **Assume it's a secret** and treat it as such
2. Ask the team lead or security officer
3. Refer to this document and related security documentation
4. When in doubt, do NOT commit to git

---

**Remember: It's easier to keep secrets out of git than to remove them after they've been committed.**
