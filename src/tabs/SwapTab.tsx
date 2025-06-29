"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { ethers } from "ethers";
import * as KuruSdk from "@kuru-labs/kuru-sdk";
import {
  ROUTER_ADDRESS,
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS
} from "~/lib/constants";
import { getKuruProvider } from "~/lib/kuru/getKuruProvider";

const KURU_API_URL = "https://api.testnet.kuru.io";

const BASE_TOKENS = [
  { symbol: "MON", address: TOKENS.MON },
  { symbol: "USDC", address: TOKENS.USDC }
];

export default function SwapTab() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const [fromToken, setFromToken] = useState(TOKENS.MON);
  const [toToken, setToToken] = useState(TOKENS.USDC);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestPath, setBestPath] = useState<KuruSdk.RouteOutput | null>(null);

  const getQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amountIn);
    if (!fromToken || !toToken || isNaN(parsedAmount) || parsedAmount <= 0) {
      setQuote(null);
      setBestPath(null);
      return;
    }

    setLoading(true);
    const provider = getKuruProvider();
    const poolFetcher = new KuruSdk.PoolFetcher(KURU_API_URL);

    try {
      const pools = await poolFetcher.getAllPools(fromToken, toToken, BASE_TOKENS);
      const path = await KuruSdk.PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        parsedAmount,
        "amountIn",
        poolFetcher,
        pools
      );

      if (!path || path.output <= 0) {
        alert("❌ No valid swap path found.");
        setQuote(null);
        setBestPath(null);
        return;
      }

      setQuote(path.output.toString());
      setBestPath(path);
    } catch (err) {
      console.error("Quote error:", err);
      setQuote(null);
      setBestPath(null);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, amountIn]);

  useEffect(() => {
    getQuote();
  }, [getQuote]);

  const doSwap = async () => {
    if (!isConnected || !quote || !bestPath || bestPath.output <= 0) {
      alert("Connect wallet & get valid quote");
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(
        (window as Window & typeof globalThis & { ethereum?: unknown }).ethereum!
      );
      const signer = await provider.getSigner();

      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

      const amount = parseFloat(amountIn);
      const isNative = fromToken === NATIVE_TOKEN_ADDRESS;
      const approveTokens = !isNative;

      await KuruSdk.TokenSwap.swap(
        signer,
        ROUTER_ADDRESS,
        bestPath,
        amount,
        inputDecimals,
        outputDecimals,
        approveTokens,
        (txHash: string | null) => {
          if (txHash) {
            console.log("tx", txHash);
            alert("✅ Swap successful");
            setAmountIn("");
            setQuote(null);
            setBestPath(null);
          }
        }
      );
    } catch (err: unknown) {
      const error = err as { error?: { message?: string }; reason?: string; code?: string };
      console.error("Swap error:", error);
      if (error?.error?.message) console.error("Revert reason:", error.error.message);
      if (error?.reason) console.error("Reason:", error.reason);
      if (error?.code) console.error("Error code:", error.code);
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
    setBestPath(null);
  };

  return (
    <div className="tab swap-tab" style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>🔄 Swap</h2>

      {!isConnected ? (
        <button
          onClick={() => {
            const injectedConnector = connectors.find(c => c.id === "injected");
            if (injectedConnector) {
              connect({ connector: injectedConnector });
            } else {
              alert("No injected wallet found.");
            }
          }}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 16,
            background: "#0070f3",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          🔌 Connect Wallet
        </button>
      ) : (
        <div style={{ marginBottom: 16, textAlign: "center", fontSize: 14 }}>
          ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}

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
              width: "120px",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              textAlign: "right"
            }}
          />
        </div>
      </div>

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
              width: "120px",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fafafa",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          />
        </div>
      </div>

      <button
        onClick={doSwap}
        disabled={!quote || loading || !isConnected}
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
