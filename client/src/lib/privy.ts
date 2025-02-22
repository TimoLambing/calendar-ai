// Configure Privy authentication
export const privyConfig = {
  appId: 'cm7g8ol1e03hjkjjrsp9ojyzh',
  // Configure login methods
  loginMethods: ['wallet', 'email'],
  // Configure appearance
  appearance: {
    theme: 'light',
    accentColor: '#3B82F6', // Blue color to match our theme
    showWalletLoginFirst: true, // Prioritize wallet connections
  },
};