// server/src/config/environment-config.ts

export const config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // API Keys
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY!,
  MORALIS_API_KEY: process.env.MORALIS_API_KEY!,
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY!,
  HELIUS_API_KEY: process.env.HELIUS_API_KEY!,

  // Server
  PORT: process.env.PORT || 6000,
};

// Validate required environment variables
export function validateEnvironment() {
  const requiredVars = [
    "DATABASE_URL",
    "ETHERSCAN_API_KEY",
    "MORALIS_API_KEY",
    "ALCHEMY_API_KEY",
    "HELIUS_API_KEY",
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
