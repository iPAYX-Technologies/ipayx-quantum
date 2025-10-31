# iPayX Quantum

Front-end clean build (no Stripe, no bloat) — foundation for iPayX EZO / Quantum Rail.

## 🚀 Stack

- **Vite** - Next-generation frontend tooling for blazing fast development
- **React 19** - Latest React with TypeScript support
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Supabase** - Open-source Firebase alternative with PostgreSQL
- **Hedera Integration** - Native wallet support for HashPack & MetaMask Snap

## ✨ Features

- ⚡ **Speed First** - Optimized for performance with Vite's lightning-fast HMR
- 🔗 **Hedera Wallet Connect** - Seamless integration with HashPack and MetaMask Snap
- 🗄️ **Supabase Backend** - PostgreSQL database with real-time capabilities
- 🔧 **Modular API Orchestration** - Centralized API management for easy integration
- 🎨 **Minimal UI** - Clean, modern interface built with Tailwind CSS
- 🤖 **AI-Ready** - Designed for AI-driven payment infrastructure

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/iPAYX-Technologies/ipayx-quantum.git
cd ipayx-quantum

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables
# Edit .env with your Supabase and Hedera credentials
```

## 🔧 Configuration

Create a `.env` file based on `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Hedera Network Configuration
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_OPERATOR_ID=
VITE_HEDERA_OPERATOR_KEY=

# Application Configuration
VITE_APP_NAME=iPayX Quantum
VITE_API_BASE_URL=http://localhost:3000
```

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🏗️ Project Structure

```
ipayx-quantum/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── WalletConnect.tsx # Hedera wallet connection
│   │   └── ApiDemo.tsx      # API orchestration demo
│   ├── hooks/               # Custom React hooks
│   │   └── useWallet.ts     # Wallet management hook
│   ├── services/            # Core services
│   │   ├── hedera-wallet.service.ts  # Hedera wallet integration
│   │   └── api-orchestrator.service.ts # API orchestration
│   ├── lib/                 # Third-party integrations
│   │   └── supabase.ts      # Supabase client
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.ts           # Vite configuration
└── package.json             # Dependencies and scripts
```

## 🔌 Wallet Integration

### HashPack
1. Install [HashPack Chrome Extension](https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk)
2. Create or import your Hedera account
3. Click "Connect HashPack" in the application

### MetaMask Snap
1. Install [MetaMask Extension](https://metamask.io/download/)
2. Click "Connect MetaMask Snap" in the application
3. Approve the Hedera Wallet Snap installation
4. Follow the prompts to connect your Hedera account

## 🔐 Supabase Integration

The application includes a pre-configured Supabase client for:
- Authentication
- Real-time data subscriptions
- PostgreSQL database queries
- File storage

Configure your Supabase project URL and anonymous key in the `.env` file.

## 🌐 API Orchestration

The API orchestrator provides a centralized way to manage API calls:

```typescript
import { apiOrchestrator } from './services/api-orchestrator.service';

// GET request
const response = await apiOrchestrator.get('/api/endpoint');

// POST request
const response = await apiOrchestrator.post('/api/endpoint', { data: 'value' });

// Set custom headers
apiOrchestrator.setHeader('Authorization', 'Bearer token');
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration supports:
- Dark mode (automatic based on system preference)
- Custom color schemes
- Responsive design utilities
- Component-based styling

## 🚫 What's NOT Included

- ❌ Stripe integration
- ❌ Heavy UI frameworks
- ❌ Unnecessary dependencies
- ❌ Legacy payment processors

## 📝 License

MIT License - Copyright (c) 2025 iPAYX-Technologies

## 🤝 Contributing

This is a foundational build for iPayX EZO / Quantum Rail. Contributions should focus on:
- Performance optimization
- Hedera network integration improvements
- API orchestration enhancements
- Security improvements

## 🔗 Links

- [Hedera Hashgraph](https://hedera.com/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
