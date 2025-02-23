// Configure Privy authentication
export const privyConfig = {
  appId: import.meta.env.VITE_PRIVY_APP_ID,
  // Configure login methods
  loginMethods: ['wallet', 'email'] as const,
  // Configure appearance
  appearance: {
    theme: 'light',
    accentColor: '#3B82F6', // Blue color to match our theme
    showWalletLoginFirst: true, // Prioritize wallet connections
  },
  // Configure domain for Replit environment
  domain: window.location.hostname.includes('.repl.co')
    ? window.location.hostname
    : window.location.host,
  // Additional configuration for Replit environment
  config: {
    loginMethods: ['wallet', 'email'] as const,
    defaultChain: 1, // Ethereum mainnet
    supportedChains: [1], // Only Ethereum mainnet for now
  }
};