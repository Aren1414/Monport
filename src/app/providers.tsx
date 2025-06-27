"use client";

import dynamic from "next/dynamic";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { NeynarProvider } from "@neynar/react";
import { SafeFarcasterSolanaProvider } from "~/components/providers/SafeFarcasterSolanaProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const solanaEndpoint = process.env.SOLANA_RPC_ENDPOINT || "https://solana-rpc.publicnode.com";
  const neynarApiKey = process.env.NEYNAR_API_KEY || "";

  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <NeynarProvider apiKey={neynarApiKey}>
          <SafeFarcasterSolanaProvider endpoint={solanaEndpoint}>
            {children}
          </SafeFarcasterSolanaProvider>
        </NeynarProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
