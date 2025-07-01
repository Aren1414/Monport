"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { ethers } from "ethers";

import {
  PoolFetcher,
  PathFinder,
  TokenSwap,
  constructSwapTransaction
} from "@kuru-labs/kuru-sdk";

import type { RouteOutput } from "@kuru-labs/kuru-sdk";

import {
  ROUTER_ADDRESS,
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS,
  RPC_URL
} from "@/lib/constants";

import ERC20_ABI from "@/abis/ERC20.json";

const KURU_API_URL = "https://api.testnet.kuru.io";

const BASE_TOKENS = [
  { symbol: "MON", address: TOKENS.MON },
  { symbol: "USDC", address: TOKENS.USDC }
];

type EthereumWindow = typeof window & {
  ethereum?: ethers.providers.ExternalProvider;
};

type ExtendedRouteOutput = RouteOutput & {
  nativeSend?: boolean[];
};

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

    const provider = new ethers.providers.Web3Provider(
      (window as EthereumWindow).ethereum!
    );

    const newBalances: Record<string, string> = {};

    for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
      try {
        if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
          const balance = await provider.getBalance(address);
          newBalances[tokenAddress] = ethers.utils.formatEther(balance);
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const decimals = TOKEN_METADATA[tokenAddress]?.decimals ?? 18;
          const balance = await contract.balanceOf(address);
          newBalances[tokenAddress] = ethers.utils.formatUnits(balance, decimals);
        }
      } catch (err) {
        console.error(`Failed to fetch balance for ${symbol}:`, err);
        newBalances[tokenAddress] = "0";
      }
    }

    setBalances(newBalances);
  }, [isConnected, address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const getQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amountIn);
    if (!fromToken || !toToken || isNaN(parsedAmount) || parsedAmount <= 0) {
      setQuote(null);
      setBestPath(null);
      return;
    }

    setLoading(true);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const poolFetcher = new PoolFetcher(KURU_API_URL);

    try {
      const pools = await poolFetcher.getAllPools(fromToken, toToken, BASE_TOKENS);
      const path = await PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        parsedAmount,
        "amountIn",
        poolFetcher,
        pools
      );

      if (!path || path.output <= 0) {
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

  const doSwap = useCallback(async () => {
  console.log("🧪 Swap Triggered");
  console.log("🔍 isConnected:", isConnected);
  console.log("🔍 amountIn:", amountIn);
  console.log("🔍 quote:", quote);
  console.log("🔍 bestPath:", bestPath);

  if (!isConnected || !quote || !bestPath || bestPath.output <= 0) {
    alert("⚠️ Connect wallet & get valid quote");
    return;
  }

  console.log("✅ Passed validation, preparing to swap...");

  setLoading(true);
  try {
    const provider = new ethers.providers.Web3Provider(
      (window as EthereumWindow).ethereum!
    );

    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log("🔐 Signer address:", signerAddress);

    const routerCode = await provider.getCode(ROUTER_ADDRESS);
    console.log("📦 Router contract code:", routerCode);
    if (routerCode === "0x") {
      throw new Error("❌ Router contract not found on this network");
    }

    const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
    const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

    const isNativeToken = (address: string) =>
      address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

    const approveTokens = !isNativeToken(fromToken);

    const extendedPath = bestPath as ExtendedRouteOutput;
    const tokenInAmount = ethers.utils.parseUnits(amountIn, inputDecimals);

    // Slippage: 0.5%
    const slippageBps = 50;
    const minTokenOut = ethers.utils.parseUnits(
      ((bestPath.output * (10000 - slippageBps)) / 10000).toFixed(outputDecimals),
      outputDecimals
    );

    const txOverrides = isNativeToken(fromToken)
      ? { value: tokenInAmount }
      : {};

    console.log("🧭 Swap Path:", bestPath.route.path);
    console.log("🧭 Pools:", bestPath.route.pools);
    console.log("💰 Output:", bestPath.output);
    console.log("🧪 fromToken:", fromToken);
    console.log("🧪 isNativeToken:", isNativeToken(fromToken));
    console.log("🧾 approveTokens:", approveTokens);
    console.log("🧪 nativeSend:", extendedPath.nativeSend);
    console.log("💸 txOverrides:", txOverrides);
    console.log("🎯 minTokenOut:", minTokenOut.toString());

    const tx = await constructSwapTransaction(
      signer,
      ROUTER_ADDRESS,
      bestPath,
      tokenInAmount,
      minTokenOut,
      txOverrides
    );

    console.log("🚀 Sending transaction:", tx);
    const sentTx = await signer.sendTransaction(tx);
    console.log("✅ Swap submitted:", sentTx.hash);
    alert("✅ Swap submitted: " + sentTx.hash);

    await sentTx.wait();
    console.log("🎉 Swap confirmed!");
    alert("✅ Swap successful!");

    // Reset state
    setAmountIn("");
    setQuote(null);
    setBestPath(null);
    fetchBalances();
  } catch (err) {
    console.error("❌ Swap error:", err);
    alert("❌ Swap failed: " + (err as Error).message);
  } finally {
    setLoading(false);
  }
}, [isConnected, amountIn, quote, bestPath, fromToken, toToken]);

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
                {sym} ({balances[addr]?.slice(0, 8) ?? "0"} available)
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
                {sym} ({balances[addr]?.slice(0, 8) ?? "0"} available)
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
