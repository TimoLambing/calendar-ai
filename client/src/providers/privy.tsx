// client/src/lib/utils.ts

import { PrivyProvider as CorePrivyProvider } from "@privy-io/react-auth";

/**
 * Wrapper around Privy provider to set up the Privy SDK.
 */
export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CorePrivyProvider
      appId="cm7g8ol1e03hjkjjrsp9ojyzh"
      config={{
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        appearance: {
          // theme: 'dark'
        },
      }}
    >
      {children}
    </CorePrivyProvider>
  );
}
