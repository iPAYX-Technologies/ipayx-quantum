# Copilot: iPayX Quantum — Final Build & Close Script (No Questions, No Pauses)

## Overview
This document provides the definitive build and deployment script for iPayX Quantum. Execute this script for production-ready builds with no user intervention required.

## Prerequisites
- Node.js v18+ installed
- npm or bun package manager
- All environment variables configured in `.env.local`
- Git repository access with appropriate permissions
- CI/CD secrets configured (for automated deployments)

## Build Script

### 1. Environment Verification
```bash
# Verify Node version
node --version  # Should be 18.x or higher

# Verify package manager
npm --version
# or
bun --version

# Check that .env.local exists and contains required variables
if [ ! -f .env.local ]; then
  echo "Error: .env.local not found. Copy .env.example and configure."
  exit 1
fi
```

### 2. Clean Build
```bash
# Remove previous build artifacts
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf .vite/

# Clear npm cache if needed
npm cache clean --force
```

### 3. Install Dependencies
```bash
# Install all dependencies with lockfile
npm ci
# or for bun
bun install --frozen-lockfile
```

### 4. Lint & Type Check
```bash
# Run linter
npm run lint

# Type check (if separate script exists)
npx tsc --noEmit
```

### 5. Production Build
```bash
# Build for production
npm run build

# Verify build output
ls -lh dist/
```

### 6. Build Verification
```bash
# Check that critical files exist
test -f dist/index.html || { echo "Error: index.html not found"; exit 1; }
test -d dist/assets || { echo "Error: assets directory not found"; exit 1; }

# Preview production build locally (optional)
# npm run preview
```

### 7. Security Checks
```bash
# Verify no secrets in built files
! grep -r "sk_live_" dist/ || { echo "Error: Live API keys found in build"; exit 1; }
! grep -r "SUPABASE_SERVICE_ROLE" dist/ || { echo "Error: Service role key exposed"; exit 1; }

# Check for environment variable references (should be VITE_ prefixed for client)
grep -r "VITE_" dist/assets/*.js > /dev/null && echo "Environment vars correctly prefixed"
```

### 8. Deployment (CI/CD Context)
```bash
# Git tag the release
git tag -a "v$(date +%Y.%m.%d-%H%M)" -m "Production build $(date)"

# Push to deployment branch
git push origin main
git push --tags
```

## One-Line Overnight Build Command

For automated overnight builds, execute:

```bash
#!/bin/bash
set -e
npm ci && \
npm run lint && \
npm run build && \
test -f dist/index.html && \
echo "✅ Build successful - Ready for deployment"
```

## Environment-Specific Builds

### Development Build
```bash
npm run build:dev
```

### Production Build with Analytics
```bash
NODE_ENV=production ANALYZE=true npm run build
```

## Post-Build Checklist
- [ ] `dist/` directory exists with index.html
- [ ] Assets are minified and optimized
- [ ] No secrets or service keys in built files
- [ ] Environment variables use correct prefixes
- [ ] Build size is reasonable (<5MB for initial load)
- [ ] Source maps generated (if enabled)

## Troubleshooting

### Build Fails with Memory Error
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Dependency Resolution Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors
```bash
# Fix auto-fixable issues
npm run lint -- --fix

# Check specific TypeScript config
npx tsc --showConfig
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Production Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: test -f dist/index.html
```

## Final Notes
- This script should execute without any user prompts
- All secrets must be injected via environment variables, never hardcoded
- Build artifacts in `dist/` should be git-ignored
- Always verify `.env.local` is in `.gitignore` before committing
- For production deployments, use CI/CD secrets management (GitHub Actions secrets, Vercel env vars, etc.)

## Support
For build issues or questions, refer to:
- `docs/SECRETS_AND_KEYS_POLICY.md` for environment configuration
- `README.md` for general setup instructions
- `.env.example` for required environment variables
