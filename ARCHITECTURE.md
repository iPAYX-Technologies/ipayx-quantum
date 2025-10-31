# iPayX Quantum Architecture

## Overview
iPayX Quantum is a minimal, AI-ready front-end for payment infrastructure built with modern web technologies. The architecture emphasizes speed, modularity, and clean separation of concerns.

## Technology Stack

### Core Framework
- **Vite 7.1.12** - Build tool optimized for speed
- **React 19.1.1** - UI library with latest features
- **TypeScript 5.9.3** - Type-safe development

### Styling
- **Tailwind CSS 4.1.16** - Utility-first CSS framework
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

### Backend Integration
- **Supabase 2.78.0** - PostgreSQL database, auth, real-time
- **Hedera SDK 2.76.0** - Blockchain integration

## Architecture Layers

### 1. Presentation Layer (`src/components/`)
React components handling UI rendering and user interactions.

**Components:**
- `Dashboard.tsx` - Main application interface
- `WalletConnect.tsx` - Hedera wallet connection UI
- `ApiDemo.tsx` - API testing interface

**Responsibilities:**
- Render UI elements
- Handle user input
- Display data from hooks/services
- No business logic

### 2. State Management Layer (`src/hooks/`)
Custom React hooks managing component state and side effects.

**Hooks:**
- `useWallet.ts` - Wallet connection state and operations

**Responsibilities:**
- Encapsulate stateful logic
- Provide clean API to components
- Handle React lifecycle
- Bridge components and services

### 3. Service Layer (`src/services/`)
Business logic and external integrations.

**Services:**
- `hedera-wallet.service.ts` - Hedera wallet integration
- `api-orchestrator.service.ts` - HTTP API management

**Responsibilities:**
- Implement business logic
- Manage external API calls
- Handle wallet interactions
- Error handling and validation

### 4. Integration Layer (`src/lib/`)
Third-party service configurations.

**Integrations:**
- `supabase.ts` - Supabase client setup

**Responsibilities:**
- Configure external services
- Provide singleton instances
- Centralize connection management

## Data Flow

```
User Interaction
    ↓
Component (Presentation)
    ↓
Hook (State Management)
    ↓
Service (Business Logic)
    ↓
External API / Blockchain
```

## Key Design Decisions

### 1. No Heavy UI Framework
- Uses Tailwind CSS for lightweight, customizable styling
- Avoids large component libraries
- Focus on performance and load time

### 2. Modular Service Architecture
- Services are independent and testable
- Clear separation between blockchain, API, and database logic
- Easy to extend or replace individual services

### 3. Type Safety
- Full TypeScript coverage
- Explicit type definitions for external APIs
- Runtime type checking where needed

### 4. Environment Configuration
- All sensitive data in environment variables
- `.env.example` template provided
- Different configs for dev/staging/prod

### 5. Wallet Flexibility
- Supports multiple Hedera wallets
- Easy to add new wallet providers
- Graceful degradation when wallets not available

## Security Considerations

### 1. No Hardcoded Secrets
- All credentials in environment variables
- `.env` files in `.gitignore`
- Environment variables prefixed with `VITE_`

### 2. Type-Safe API Calls
- Explicit type checking on API responses
- Timeout handling for all requests
- Error boundaries for user safety

### 3. Wallet Integration
- User consent required for all wallet operations
- No private keys stored in application
- Read-only access by default

## Performance Optimizations

### 1. Build Optimization
- Vite for fast HMR in development
- Tree-shaking in production builds
- Code splitting for optimal load times

### 2. CSS Optimization
- Tailwind purges unused styles
- PostCSS minimization
- Critical CSS inlined

### 3. Runtime Performance
- Minimal dependencies
- Lazy loading where applicable
- Efficient React hooks usage

## Extensibility Points

### Adding New Wallets
1. Add detection method to `HederaWalletService`
2. Implement connection logic
3. Update `useWallet` hook
4. Add UI button in `WalletConnect`

### Adding New API Endpoints
1. Use `apiOrchestrator` service methods
2. Add type definitions for responses
3. Create component or hook as needed

### Adding Database Operations
1. Import `supabase` client
2. Use Supabase SDK methods
3. Add TypeScript types for tables
4. Handle real-time subscriptions if needed

## Development Workflow

### Local Development
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in Supabase credentials
3. Configure Hedera network (testnet/mainnet)
4. Set API base URL

## Deployment Considerations

### Build Output
- Static files in `dist/` directory
- Can be deployed to any static hosting
- No server-side rendering required

### Environment Variables
- Set production values in hosting platform
- Never commit `.env` to version control
- Use different keys for different environments

### Recommended Hosting
- Vercel (optimized for Vite)
- Netlify (easy setup)
- Cloudflare Pages (global CDN)
- Any static host

## Future Enhancements

### Potential Additions
- [ ] Real-time transaction monitoring
- [ ] Multi-signature wallet support
- [ ] Advanced API request batching
- [ ] Offline mode support
- [ ] Progressive Web App (PWA) features
- [ ] Enhanced error tracking
- [ ] Analytics integration

### Scalability
- Service layer ready for backend extraction
- API orchestrator can route to multiple backends
- State management can upgrade to Redux/Zustand if needed

## Maintenance

### Dependencies
- Regular updates for security patches
- Test thoroughly before major version upgrades
- Monitor Hedera SDK for breaking changes

### Code Quality
- ESLint enforces code standards
- TypeScript catches type errors
- Build process validates before deployment

## Support

### Debugging
- Browser DevTools for React components
- Network tab for API calls
- Console logs for service operations

### Common Issues
- Wallet not connecting: Check browser extension
- API errors: Verify environment variables
- Build failures: Clear node_modules and reinstall
