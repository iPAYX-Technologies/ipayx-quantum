# iPayX Quantum — Final Build & Close Script (No Questions, No Pauses)

This document provides a comprehensive, automated build and deployment script for iPayX Quantum. Execute these steps in sequence to finalize the build and close the development cycle.

## Prerequisites

- Node.js 18+ and npm/bun installed
- Git repository access configured
- All environment variables configured in `.env.local` (see SECRETS_AND_KEYS_POLICY.md)
- Supabase project credentials available
- CI/CD pipeline configured

## Build Script

### 1. Pre-Flight Checks

```bash
# Verify environment
node --version
npm --version

# Check for required environment files
test -f .env.local && echo "✓ .env.local found" || echo "✗ .env.local missing"

# Verify no secrets in git
git grep -n "PLAID_SECRET\|SUPABASE_SERVICE_ROLE\|API_KEY" -- '*.ts' '*.tsx' '*.js' '*.jsx' || echo "✓ No hardcoded secrets detected"
```

### 2. Dependency Installation

```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Verify lockfile integrity
npm audit --audit-level=moderate
```

### 3. Type Checking

```bash
# Run TypeScript compiler checks
npx tsc --noEmit

# Check for type errors
echo "TypeScript compilation check complete"
```

### 4. Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues where possible
npm run lint -- --fix
```

### 5. Build Production Bundle

```bash
# Create optimized production build
npm run build

# Verify dist output
test -d dist && echo "✓ Build output created" || exit 1

# Check bundle size
du -sh dist/
```

### 6. Security Audit

```bash
# Run dependency security audit
npm audit --production

# Check for high/critical vulnerabilities
npm audit --audit-level=high
```

### 7. Database Migration Verification

```bash
# Verify Supabase migrations are applied
# Note: Run this if you have supabase CLI configured
# supabase db push

# Check migration status
echo "Verify all migrations applied in Supabase dashboard"
```

### 8. Environment Validation

```bash
# Validate environment variables are set
node -e "
const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('Missing required env vars:', missing);
  process.exit(1);
}
console.log('✓ All required environment variables present');
"
```

### 9. Git Commit and Tag

```bash
# Stage all changes
git add .

# Commit with version bump
VERSION=$(node -p "require('./package.json').version")
git commit -m "chore: build v${VERSION} - production release"

# Create version tag
git tag -a "v${VERSION}" -m "Release version ${VERSION}"

# Push to remote
git push origin main
git push origin --tags
```

### 10. Deployment

```bash
# Deploy to production
# This depends on your deployment platform
# Example for Vercel:
# npx vercel --prod

# Example for Netlify:
# npx netlify deploy --prod

# Or manual upload to hosting service
echo "Deploy dist/ folder to production hosting"
```

### 11. Post-Deployment Verification

```bash
# Verify production site is accessible
# curl -I https://your-production-url.com

# Check critical endpoints
echo "Manually verify:"
echo "1. Homepage loads"
echo "2. Authentication works"
echo "3. Dashboard displays correctly"
echo "4. API integrations functional"
```

### 12. Close Out

```bash
# Create deployment record
echo "Deployment completed: $(date)" >> DEPLOYMENT_LOG.md

# Notify team (example)
echo "Build and deployment completed successfully"
echo "Version: ${VERSION}"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
```

## Automated Full Script

Save this as `build-and-close.sh`:

```bash
#!/bin/bash
set -e  # Exit on any error

echo "=== iPayX Quantum Build & Close Script ==="
echo "Starting at: $(date)"

# Pre-flight
echo "→ Pre-flight checks..."
node --version
npm --version

# Dependencies
echo "→ Installing dependencies..."
npm ci

# Type check
echo "→ Type checking..."
npx tsc --noEmit

# Lint
echo "→ Linting..."
npm run lint

# Build
echo "→ Building production bundle..."
npm run build

# Security
echo "→ Security audit..."
npm audit --production --audit-level=moderate || true

# Git
echo "→ Committing and tagging..."
VERSION=$(node -p "require('./package.json').version")
git add .
git commit -m "chore: build v${VERSION} - production release" || echo "Nothing to commit"
git tag -a "v${VERSION}" -m "Release version ${VERSION}" || echo "Tag exists"

echo "=== Build Complete ==="
echo "Version: ${VERSION}"
echo "Next steps: Push tags and deploy dist/ folder"
echo "Completed at: $(date)"
```

## Troubleshooting

### Build Fails

- Check Node.js version compatibility
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Verify all environment variables are set correctly

### Type Errors

- Run `npx tsc --noEmit` to see detailed errors
- Check for missing type definitions: `npm install --save-dev @types/...`

### Deployment Issues

- Verify build output in `dist/` folder
- Check environment variables on hosting platform
- Review deployment logs for specific errors

## Security Checklist

- [ ] No secrets committed to git
- [ ] `.env.local` is in `.gitignore`
- [ ] All API keys use `process.env` variables
- [ ] Production environment variables set in hosting platform
- [ ] Security headers configured (see docs/security/headers.md)
- [ ] HTTPS enabled on production domain
- [ ] CORS configured correctly for production API endpoints

## Support

For issues or questions:
- Review SECRETS_AND_KEYS_POLICY.md
- Check SETUP.md for initial configuration
- Consult SECURITY.md for security guidelines
