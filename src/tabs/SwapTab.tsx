"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import * as Select from "@radix-ui/react-select";
import { useAccount, useConnect } from "wagmi";
import { ethers, utils as ethersUtils } from "ethers";
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
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchLogos = async () => {
      const logos: Record<string, string> = {};

      try {
        const baseTokens = Object.entries(TOKENS).map(([symbol, address]) => ({
          symbol,
          address,
        }));

        const pairs = baseTokens.flatMap((base1, i) =>
          baseTokens.slice(i + 1).map((base2) => ({
            baseToken: base1.address,
            quoteToken: base2.address,
          }))
        );

        const response = await fetch(
          `${KURU_API_URL.replace(/\/$/, "")}/api/v1/markets/filtered`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ pairs }),
          }
        );

        type Token = { address: string; image?: string };
        type Market = { baseasset: Token; quoteasset: Token };
        type MarketResponse = { data: Market[] };

        const data: MarketResponse = await response.json();

        data.data.forEach((market) => {
          const base = market.baseasset;
          const quote = market.quoteasset;

          if (base?.address && base?.image) {
            logos[ethersUtils.getAddress(base.address)] = base.image;
          }

          if (quote?.address && quote?.image) {
            logos[ethersUtils.getAddress(quote.address)] = quote.image;
          }
        });

        setTokenLogos(logos);
      } catch (err) {
        console.error("❌ Failed to fetch token logos:", err);
      }
    };

    fetchLogos();
  }, []);

const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) return;

    const provider = new ethers.providers.Web3Provider(
      (window as EthereumWindow).ethereum!
    );

    const newBalances: Record<string, string> = {};

    for (const [symbol, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const normalized = ethersUtils.getAddress(tokenAddress);
        if (normalized === NATIVE_TOKEN_ADDRESS) {
          const balance = await provider.getBalance(address);
          newBalances[normalized] = ethers.utils.formatEther(balance);
        } else {
          const contract = new ethers.Contract(normalized, ERC20_ABI, provider);
          const decimals = TOKEN_METADATA[normalized]?.decimals ?? 18;
          const balance = await contract.balanceOf(address);
          newBalances[normalized] = ethers.utils.formatUnits(balance, decimals);
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

  useEffect(() => {
    if (!isConnected || !address) return;

    const provider = new ethers.providers.Web3Provider(
      (window as EthereumWindow).ethereum!
    );

    const updateOnBlock = async () => {
      await fetchBalances();
    };

    provider.on("block", updateOnBlock);
    return () => {
      provider.off("block", updateOnBlock);
    };
  }, [isConnected, address, fetchBalances]);

  useEffect(() => {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) return;

    const handleAccountsChanged = () => fetchBalances();
    const handleChainChanged = () => fetchBalances();

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [fetchBalances]);

  const getQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amountIn);
    if (!fromToken || !toToken || isNaN(parsedAmount) || parsedAmount <= 0 || !isConnected || !address) {
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      return;
    }

    setLoading(true);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const poolFetcher = new PoolFetcher(KURU_API_URL);

    const decimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
    const amountInUnits = ethers.utils.parseUnits(parsedAmount.toString(), decimals);

    try {
      const baseTokens = Object.entries(TOKENS).map(([symbol, address]) => ({
        symbol,
        address
      }));

      const pools = await poolFetcher.getAllPools(fromToken, toToken, baseTokens);

      if (!pools || pools.length === 0) {
        setQuote(null);
        setBestPath(null);
        setApprovalNeeded(false);
        return;
      }

      const path = await PathFinder.findBestPath(
        provider,
        fromToken,
        toToken,
        parseFloat(ethers.utils.formatUnits(amountInUnits, decimals)),
        "amountIn",
        poolFetcher,
        pools
      );

      if (!path || path.output <= 0) {
        setQuote(null);
        setBestPath(null);
        setApprovalNeeded(false);
        return;
      }

      setQuote(path.output.toString());
      setBestPath(path);

      if (fromToken !== NATIVE_TOKEN_ADDRESS) {
        const web3Provider = new ethers.providers.Web3Provider(
          (window as EthereumWindow).ethereum!
        );
        const signer = web3Provider.getSigner();
        const contract = new ethers.Contract(fromToken, ERC20_ABI, signer);
        const allowance = await contract.allowance(address, ROUTER_ADDRESS);
        setApprovalNeeded(allowance.lt(amountInUnits));
      } else {
        setApprovalNeeded(false);
      }
    } catch (err) {
      console.error("❌ Quote error:", err);
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, amountIn, isConnected, address]);

  useEffect(() => {
    getQuote();
  }, [getQuote]);

const doSwap = useCallback(async () => {
    if (!isConnected || !quote || !bestPath || bestPath.output <= 0) {
      alert("⚠️ Please connect your wallet and enter a valid amount.");
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
      const isNative = fromToken === NATIVE_TOKEN_ADDRESS;

      const txHash = await new Promise<string | null>((resolve) => {
        TokenSwap.swap(
          signer,
          ROUTER_ADDRESS,
          bestPath,
          parseFloat(amountIn),
          inputDecimals,
          outputDecimals,
          1,
          !isNative,
          (hash) => resolve(hash)
        );
      });

      if (txHash) {
        const receipt = await provider.waitForTransaction(txHash, 1);
        if (receipt && receipt.status === 1) {
          setAmountIn("");
          setQuote(null);
          setBestPath(null);
          await fetchBalances();
          alert("✅ Swap completed successfully.");
        } else {
          alert("⚠️ Swap transaction failed or was reverted.");
        }
      } else {
        alert("⚠️ Swap was rejected or failed to broadcast.");
      }
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

  const renderTokenSelect = (
  value: string,
  onChange: (val: string) => void
) => {
  const symbol = Object.entries(TOKENS).find(([, addr]) => addr === value)?.[0];
  const logo = tokenLogos[ethersUtils.getAddress(value)];

  return (
    <Select.Root value={value} onValueChange={onChange}>
  <Select.Trigger
    style={{
      flex: 1,
      minWidth: 0,
      padding: 8,
      borderRadius: 8,
      border: "1px solid #ccc",
      background: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",    
      overflow: "visible"       
    }}
  >
    <Select.Value asChild>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {logo && (
          <Image
            src={logo}
            alt={symbol || "token"}
            width={16}
            height={16}
            style={{ borderRadius: "50%" }}
          />
        )}
        <span>{symbol}</span>
      </div>
    </Select.Value>
    <Select.Icon>▼</Select.Icon>
  </Select.Trigger>

  <Select.Content
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: "#fff",
      border: "1px solid #ccc",
      borderRadius: 8,
      padding: 4,
      zIndex: 9999,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    }}
  >
    <Select.Viewport>
      {Object.entries(TOKENS).map(([symbol, addr]) => {
        const normalized = ethersUtils.getAddress(addr);
        const logo = tokenLogos[normalized];
        const balance = parseFloat(balances[normalized] || "0").toFixed(3);

        return (
          <Select.Item
            key={normalized}
            value={normalized}
            style={{
              display: "flex",
              alignItems: "center",
              padding: 6,
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            {logo && (
              <Image
                src={logo}
                alt={symbol}
                width={20}
                height={20}
                style={{ marginRight: 8, borderRadius: "50%" }}
              />
            )}
            <span style={{ fontSize: 14 }}>{symbol}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
              {balance}
            </span>
          </Select.Item>
        );
      })}
    </Select.Viewport>
  </Select.Content>
</Select.Root>
);
  
  return (
    <div
      className="tab swap-tab"
      style={{
        maxWidth: 420,
        margin: "0 auto",
        padding: 16,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
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

      {/* FROM SECTION */}
      <div style={{
        background: "#f5f5f5",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        boxSizing: "border-box"
      }}>
        <label style={{ fontWeight: "bold" }}>From</label>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Balance: {parseFloat(balances[fromToken] || "0").toFixed(3)}
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginTop: 4
        }}>
          {renderTokenSelect(fromToken, setFromToken)}
          <input
            type="number"
            step="any"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
              textAlign: "right"
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {[10, 20, 50, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => {
                const balance = parseFloat(balances[fromToken] || "0");
                const value = (balance * percent) / 100;
                setAmountIn(value.toFixed(6));
              }}
              style={{
                flex: 1,
                margin: "0 2px",
                padding: "4px 0",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              {percent === 100 ? "Max" : `${percent}%`}
            </button>
          ))}
        </div>
      </div>

      {/* SWAP ICON */}
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

      {/* TO SECTION */}
      <div style={{
        background: "#f5f5f5",
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        boxSizing: "border-box"
      }}>
        <label style={{ fontWeight: "bold" }}>To</label>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Balance: {parseFloat(balances[toToken] || "0").toFixed(3)}
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginTop: 4
        }}>
          {renderTokenSelect(toToken, setToToken)}
          <input
            value={quote ? parseFloat(quote).toFixed(3) : ""}
            readOnly
            placeholder="0.0"
            style={{
              flex: 1,
              minWidth: 0,
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

      {/* APPROVE / SWAP BUTTON */}
      <button
        onClick={async () => {
          if (approvalNeeded) {
            try {
              const provider = new ethers.providers.Web3Provider(
                (window as EthereumWindow).ethereum!
              );
              const signer = provider.getSigner();
              const contract = new ethers.Contract(fromToken, ERC20_ABI, signer);
              const tx = await contract.approve(
                ROUTER_ADDRESS,
                ethers.constants.MaxUint256
              );
              await tx.wait();
              setApprovalNeeded(false);
              alert("✅ Token approved successfully.");
            } catch (err) {
              alert("❌ Approval failed: " + (err as Error).message);
            }
          } else {
            await doSwap();
          }
        }}
        disabled={!quote || loading || !isConnected}
        style={{
          width: "100%",
          padding: 12,
          background: approvalNeeded ? "#ffc107" : "#28a745",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: !quote || loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? (
          "Processing…"
        ) : approvalNeeded ? (
          "Approve"
        ) : (
          "Swap Now"
        )}
      </button>
    </div>
  );
}
