"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NeynarContextProvider } from "@neynar/react";
import { SafeFarcasterSolanaProvider } from "~/components/providers/SafeFarcasterSolanaProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  { ssr: false }
);

export function Providers({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const solanaEndpoint =
    process.env.SOLANA_RPC_ENDPOINT || "https://solana-rpc.publicnode.com";

  const neynarClientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;

  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <NeynarContextProvider
          settings={{
            clientId: neynarClientId!,
          }}
        >
          <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
            {children}
          </SafeFarcasterSolanaProvider>
        </NeynarContextProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
