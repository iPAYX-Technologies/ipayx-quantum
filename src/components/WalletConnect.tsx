import { useWallet } from '../hooks/useWallet';

export function WalletConnect() {
  const {
    connection,
    isConnecting,
    error,
    isConnected,
    connectHashPack,
    connectMetaMask,
    disconnect,
    hasHashPack,
    hasMetaMask,
  } = useWallet();

  if (isConnected && connection) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wallet Connected
          </h3>
          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
            {connection.provider}
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Account ID:</span>
            <span className="font-mono text-gray-900 dark:text-white">
              {connection.accountId}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Network:</span>
            <span className="text-gray-900 dark:text-white">{connection.network}</span>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Connect Wallet
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={connectHashPack}
          disabled={!hasHashPack || isConnecting}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <span>Connecting...</span>
          ) : (
            <>
              <span>Connect HashPack</span>
              {!hasHashPack && <span className="text-xs">(Not Installed)</span>}
            </>
          )}
        </button>

        <button
          onClick={connectMetaMask}
          disabled={!hasMetaMask || isConnecting}
          className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <span>Connecting...</span>
          ) : (
            <>
              <span>Connect MetaMask Snap</span>
              {!hasMetaMask && <span className="text-xs">(Not Installed)</span>}
            </>
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Install HashPack or MetaMask to connect your Hedera wallet
      </p>
    </div>
  );
}
