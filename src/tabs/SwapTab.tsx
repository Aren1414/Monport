"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import * as KuruSdk from "@kuru-labs/kuru-sdk";
import {
  ROUTER_ADDRESS,
  TOKENS,
  TOKEN_METADATA
} from "~/lib/constants";
import { getKuruProvider } from "~/lib/kuru/getKuruProvider";

export default function SwapTab() {
  const { isConnected } = useAccount();
  const [fromToken, setFromToken] = useState(TOKENS.USDC);
  const [toToken, setToToken] = useState(TOKENS.MON);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getQuote = async () => {
    if (!fromToken || !toToken || !amountIn) return;
    setLoading(true);
    const provider = getKuruProvider();
    try {
      const path = await KuruSdk.PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        Number(amountIn),
        "amountIn"
      );
      setQuote(path.output.toString());
    } catch {
      alert("Error getting quote");
    } finally {
      setLoading(false);
    }
  };

  const doSwap = async () => {
    if (!isConnected || !quote) return alert("Connect wallet & get quote");
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(
        (window as Window & typeof globalThis & { ethereum?: unknown }).ethereum!
      );
      const signer = await provider.getSigner();
      const path = await KuruSdk.PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        Number(amountIn),
        "amountIn"
      );

      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals;

      if (inputDecimals === undefined || outputDecimals === undefined) {
        alert("Missing token decimal metadata.");
        return;
      }

      await KuruSdk.TokenSwap.swap(
        signer,
        ROUTER_ADDRESS,
        path,
        Number(amountIn),
        inputDecimals,
        outputDecimals,
        30,
        true,
        (tx: string) => {
          console.log("tx", tx);
        }
      );

      alert("✅ Swap successful");
      setAmountIn("");
      setQuote(null);
    } catch {
      alert("Swap failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab swap-tab">
      <h2>🔄 Swap</h2>

      <label>From Token:</label>
      <select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
        {Object.entries(TOKENS).map(([sym, addr]) => (
          <option key={sym} value={addr}>
            {sym}
          </option>
        ))}
      </select>

      <label>To Token:</label>
      <select value={toToken} onChange={(e) => setToToken(e.target.value)}>
        {Object.entries(TOKENS).map(([sym, addr]) => (
          <option key={sym} value={addr}>
            {sym}
          </option>
        ))}
      </select>

      <input
        placeholder="Amount In"
        value={amountIn}
        onChange={(e) => setAmountIn(e.target.value)}
      />

      <button onClick={getQuote} disabled={loading}>
        {loading ? "Fetching…" : "Get Quote"}
      </button>

      {quote && <div>Estimated Out: {quote}</div>}

      <button onClick={doSwap} disabled={!quote || loading}>
        {loading ? "Processing…" : "Swap Now"}
      </button>
    </div>
  );
}
