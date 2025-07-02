"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { ethers } from "ethers";
import {
  PoolFetcher,
  PathFinder,
  TokenSwap,
} from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";

import {
  ROUTER_ADDRESS,
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS,
  RPC_URL,
} from "@/lib/constants";
import ERC20_ABI from "@/abis/ERC20.json";

const KURU_API_URL = "https://api.testnet.kuru.io";
const BASE_TOKENS = [
  { symbol: "MON", address: TOKENS.MON },
  { symbol: "USDC", address: TOKENS.USDC },
];

const isNativeToken = (address: string) =>
  address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

export default function SwapTab() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const [fromToken, setFromToken] = useState(TOKENS.MON);
  const [toToken, setToToken] = useState(TOKENS.USDC);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestPath, setBestPath] = useState<RouteOutput | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum!);
    const newBalances: Record<string, string> = {};

    for (const addr of Object.values(TOKENS)) {
      try {
        if (isNativeToken(addr)) {
          const bal = await provider.getBalance(address);
          newBalances[addr] = ethers.utils.formatEther(bal);
        } else {
          const contract = new ethers.Contract(addr, ERC20_ABI, provider);
          const bal = await contract.balanceOf(address);
          const dec = TOKEN_METADATA[addr]?.decimals ?? 18;
          newBalances[addr] = ethers.utils.formatUnits(bal, dec);
        }
      } catch {
        newBalances[addr] = "0";
      }
    }
    setBalances(newBalances);
  }, [isConnected, address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const getQuote = useCallback(async () => {
    const amt = parseFloat(amountIn);
    if (!fromToken || !toToken || isNaN(amt) || amt <= 0 || fromToken === toToken) {
      setQuote(null);
      setBestPath(null);
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const pools = await new PoolFetcher(KURU_API_URL).getAllPools(fromToken, toToken, BASE_TOKENS);
      const path = await PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        amt,
        "amountIn",
        new PoolFetcher(KURU_API_URL),
        pools
      );
      if (!path || path.output <= 0) {
        setQuote(null);
      } else {
        setQuote(path.output.toString());
        setBestPath(path);
      }
    } catch (e) {
      console.error("Quote error:", e);
      setQuote(null);
      setBestPath(null);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, amountIn]);

  useEffect(() => {
    getQuote();
  }, [getQuote]);

  const doSwap = useCallback(async () => {
    if (!isConnected || !quote || !bestPath || parseFloat(quote) <= 0) {
      alert("Connect wallet & get valid quote");
      return;
    }

    if (fromToken === toToken) {
      alert("Cannot swap same token");
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum!);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const approveTokens = !isNativeToken(fromToken);

      await TokenSwap.swap(
        signer,
        ROUTER_ADDRESS,
        bestPath,
        parseFloat(amountIn),
        TOKEN_METADATA[fromToken]?.decimals ?? 18,
        TOKEN_METADATA[toToken]?.decimals ?? 18,
        approveTokens,
        (txHash) => {
          if (txHash) {
            alert("Swap submitted: " + txHash);
            setAmountIn("");
            setQuote(null);
            setBestPath(null);
            fetchBalances();
          } else {
            alert("Swap rejected");
          }
        }
      );
    } catch (err) {
      console.error("Swap error:", err);
      alert("Swap failed: " + (err as any).message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, amountIn, quote, bestPath, fromToken, toToken, fetchBalances]);

  const swapTokens = () => {
    const tmp = fromToken;
    setFromToken(toToken);
    setToToken(tmp);
    setAmountIn("");
    setQuote(null);
    setBestPath(null);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 16 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Swap</h2>

      {!isConnected ? (
        <button
          onClick={() => {
            const inj = connectors.find((c) => c.id === "injected");
            inj ? connect({ connector: inj }) : alert("No wallet found");
          }}
          style={{
            width: "100%",
            padding: 12,
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 8,
          }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}

      {/* From Token */}
      <div style={{ marginBottom: 12, background: "#f5f5f5", padding: 12, borderRadius: 12 }}>
        <label style={{ fontWeight: "bold" }}>From</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8 }}
          >
            {Object.entries(TOKENS).map(([symbol, addr]) => (
              <option key={addr} value={addr}>
                {symbol} ({parseFloat(balances[addr] || "0").toFixed(6)})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="any"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            style={{
              width: 120,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 8,
              textAlign: "right",
            }}
          />
          <button
            onClick={() => setAmountIn(balances[fromToken] || "")}
            style={{
              padding: "4px 8px",
              background: "#ccc",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Max
          </button>
        </div>
      </div>

      {/* To Token */}
      <div style={{ marginBottom: 12, background: "#f5f5f5", padding: 12, borderRadius: 12 }}>
        <label style={{ fontWeight: "bold" }}>To</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8 }}
          >
            {Object.entries(TOKENS).map(([symbol, addr]) => (
              <option key={addr} value={addr}>
                {symbol} ({parseFloat(balances[addr] || "0").toFixed(6)})
              </option>
            ))}
          </select>
          <input
            readOnly
            placeholder="0.0"
            value={quote || ""}
            style={{
              width: 120,
              padding: 8,
              border: "1px solid #ccc",
              borderRadius: 8,
              background: "#fafafa",
              textAlign: "right",
            }}
          />
        </div>
        <div style={{ marginTop: 4, fontSize: 13, color: "#666" }}>
          Estimated received: {quote ? parseFloat(quote).toFixed(6) : "–"}
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={doSwap}
        disabled={!quote || loading || !isConnected}
        style={{
          width: "100%",
          padding: 12,
          background: !quote || loading || !isConnected ? "#aaa" : "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: !quote || loading || !isConnected ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing…" : "Swap Now"}
      </button>
    </div>
  );
}
