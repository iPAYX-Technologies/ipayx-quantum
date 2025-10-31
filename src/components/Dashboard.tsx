import { WalletConnect } from './WalletConnect';
import { ApiDemo } from './ApiDemo';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            iPayX Quantum Core
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-Ready Payment Infrastructure • Vite + React + Tailwind + Supabase + Hedera
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Feature Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 text-xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                High Performance
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Built with Vite for blazing fast development and optimized production builds
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-300 text-xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Hedera Integration
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Native support for HashPack and MetaMask Snap wallet connections
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-300 text-xl">🗄️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Supabase Backend
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              PostgreSQL database with real-time subscriptions and authentication
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-300 text-xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Modular API
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Centralized API orchestration for easy integration and management
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WalletConnect />
          <ApiDemo />
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built for iPayX EZO / Quantum Rail • No Stripe, No Bloat</p>
        </footer>
      </div>
    </div>
  );
}
