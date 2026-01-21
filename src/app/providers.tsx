"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clxxxxxxxxxxxxxxxxxx"}
      config={{
        loginMethods: ["google", "sms", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#00ffff",
          logo: "/lupin-logo.svg",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
