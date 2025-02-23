// Configure Privy authentication
export const privyConfig = {
  appId: (() => {
    const appId = import.meta.env.VITE_PRIVY_APP_ID;
    if (!appId) {
      console.error('VITE_PRIVY_APP_ID is not set in environment variables');
      throw new Error('Privy App ID is not configured');
    }
    console.log('Initializing Privy with App ID:', appId);
    return appId;
  })(),
  // Configure login methods
  loginMethods: ['wallet', 'email'],
  // Configure appearance
  appearance: {
    theme: 'light',
    accentColor: '#3B82F6', // Blue color to match our theme
    showWalletLoginFirst: true, // Prioritize wallet connections
  },
  // Configure domain for Replit environment
  domain: window.location.host,
  // Additional configuration for Replit environment
  config: {
    loginMethods: ['wallet', 'email'],
    defaultChain: 1, // Ethereum mainnet
    supportedChains: [1], // Only Ethereum mainnet for now
  }
};