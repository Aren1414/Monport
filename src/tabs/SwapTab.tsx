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
        (txHash: string | null) => {
          if (txHash) console.log("tx", txHash);
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

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
    setAmountIn("");
  };

  return (
    <div className="tab swap-tab" style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>🔄 Swap</h2>

      {/* From Token */}
      <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontWeight: "bold" }}>From</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8 }}
          >
            {Object.entries(TOKENS).map(([sym, addr]) => (
              <option key={sym} value={addr}>
                {sym}
              </option>
            ))}
          </select>
          <input
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              textAlign: "right"
            }}
          />
        </div>
      </div>

      {/* Switch Button */}
      <div style={{ textAlign: "center", margin: "8px 0" }}>
        <button
          onClick={swapTokens}
          style={{
            background: "#eee",
            border: "none",
            borderRadius: "50%",
            padding: 8,
            cursor: "pointer"
          }}
        >
          ⬇️
        </button>
      </div>

      {/* To Token */}
      <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontWeight: "bold" }}>To</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8 }}
          >
            {Object.entries(TOKENS).map(([sym, addr]) => (
              <option key={sym} value={addr}>
                {sym}
              </option>
            ))}
          </select>
          <input
            value={quote ?? ""}
            readOnly
            placeholder="0.0"
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fafafa",
              textAlign: "right"
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <button
        onClick={getQuote}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          background: "#1d9bf0",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          marginBottom: 8,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Fetching…" : "Get Quote"}
      </button>

      <button
        onClick={doSwap}
        disabled={!quote || loading}
        style={{
          width: "100%",
          padding: 12,
          background: "#28a745",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: !quote || loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Processing…" : "Swap Now"}
      </button>
    </div>
  );
}
