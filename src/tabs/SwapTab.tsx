"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect } from "wagmi";
import { ethers } from "ethers";
import {
  PoolFetcher,
  PathFinder,
  TokenSwap
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

type EthereumWindow = typeof window & {
  ethereum?: ethers.providers.ExternalProvider;
};

type ExtendedRouteOutput = RouteOutput & {
  tx?: { data: string };
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
  const [bestPath, setBestPath] = useState<ExtendedRouteOutput | null>(null);
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

    const effectiveFromToken = fromToken;
    const decimals = TOKEN_METADATA[effectiveFromToken]?.decimals ?? 18;
    const amountInUnits = ethers.utils.parseUnits(parsedAmount.toString(), decimals);

    try {
      console.log("🚀 getQuote triggered", { fromToken, toToken, amountIn });

      const baseTokens = Object.entries(TOKENS).map(([symbol, address]) => ({
        symbol,
        address
      }));

      const pools = await poolFetcher.getAllPools(effectiveFromToken, toToken, baseTokens);
      console.log("📦 Pools fetched:", pools.length);

      if (!pools || pools.length === 0) {
        console.warn("❌ No pools found for this token pair");
        setQuote(null);
        setBestPath(null);
        return;
      }

      const path = await PathFinder.findBestPath(
        provider,
        effectiveFromToken,
        toToken,
        parseFloat(ethers.utils.formatUnits(amountInUnits, decimals)),
        "amountIn",
        poolFetcher,
        pools
      );

      if (!path || path.output <= 0) {
        console.warn("⚠️ No valid path found or output is zero.");
        setQuote(null);
        setBestPath(null);
        return;
      }

      console.log("🧭 Best path:", path.route?.path);
      console.log("💰 Output amount:", path.output);

      const pathWithExtras = path as ExtendedRouteOutput;
      setQuote(path.output.toString());
      setBestPath(pathWithExtras);
    } catch (err) {
      console.error("❌ Quote error:", err);
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
  if (!isConnected || !quote || !bestPath || bestPath.output <= 0) {
    alert("⚠️ Connect wallet & get valid quote");
    return;
  }

  setLoading(true);
  try {
    const provider = new ethers.providers.Web3Provider(
      (window as EthereumWindow).ethereum!
    );
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
    const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

    const isNativeInput = fromToken === NATIVE_TOKEN_ADDRESS;

    
    const updatedPath: ExtendedRouteOutput = JSON.parse(JSON.stringify(bestPath));

    if (isNativeInput) {
      // ✅ wrap MON → WMON
      const wmonAbi = ["function deposit() public payable"];
      const wmon = new ethers.Contract(TOKENS.WMON, wmonAbi, signer);
      const wrapTx = await wmon.deposit({
        value: ethers.utils.parseUnits(amountIn, inputDecimals)
      });
      await wrapTx.wait();
      console.log("✅ Wrapped MON → WMON");

      
      (updatedPath.route as { [key: string]: unknown }).tokenIn = TOKENS.WMON;
      updatedPath.route.path[0] = TOKENS.WMON; 
    }

    const onTxHash = (txHash: string | null) => {
      if (txHash) {
        alert("✅ Swap submitted: " + txHash);
        setAmountIn("");
        setQuote(null);
        setBestPath(null);
        fetchBalances();
      } else {
        alert("⚠️ Swap failed or rejected");
      }
    };

    await TokenSwap.swap(
      signer,
      ROUTER_ADDRESS,
      updatedPath,
      parseFloat(amountIn),
      inputDecimals,
      outputDecimals,
      false, 
      onTxHash
    );
  } catch (err) {
    alert("❌ Swap failed: " + (err as Error).message);
  } finally {
    setLoading(false);
  }
}, [isConnected, amountIn, quote, bestPath, fromToken, toToken, fetchBalances]);
  
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
