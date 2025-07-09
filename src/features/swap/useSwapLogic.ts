"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import {
  PoolFetcher,
  PathFinder,
  TokenSwap
} from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";

import {
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS,
  ROUTER_ADDRESS,
  RPC_URL
} from "@/lib/constants";
import ERC20_ABI from "@/abis/ERC20.json";

export function useSwapLogic() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [fromToken, setFromToken] = useState(TOKENS.MON);
  const [toToken, setToToken] = useState(TOKENS.USDC);
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bestPath, setBestPath] = useState<RouteOutput | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [approvalNeeded, setApprovalNeeded] = useState(false);

  const previousBalancesRef = useRef<Record<string, string>>({});

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address || !walletClient) return;

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const newBalances: Record<string, string> = {};

    for (const [, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const normalized = ethers.utils.getAddress(tokenAddress);
        if (normalized === NATIVE_TOKEN_ADDRESS) {
          const balance = await provider.getBalance(address);
          newBalances[normalized] = ethers.utils.formatEther(balance);
        } else {
          const contract = new ethers.Contract(normalized, ERC20_ABI, provider);
          const decimals = TOKEN_METADATA[normalized]?.decimals ?? 18;
          const balance = await contract.balanceOf(address);
          newBalances[normalized] = ethers.utils.formatUnits(balance, decimals);
        }
      } catch {
        newBalances[tokenAddress] = "0";
      }
    }

    const prev = previousBalancesRef.current;
    const changed = Object.keys(newBalances).some(
      (key) => newBalances[key] !== prev[key]
    );

    if (changed) {
      previousBalancesRef.current = newBalances;
      setBalances(newBalances);
    }
  }, [isConnected, address, walletClient]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const getQuote = useCallback(async () => {
    const parsedAmount = parseFloat(amountIn);
    if (!fromToken || !toToken || isNaN(parsedAmount) || parsedAmount <= 0 || !isConnected || !address || !walletClient) {
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      return;
    }

    setLoading(true);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const poolFetcher = new PoolFetcher("https://api.testnet.kuru.io");

    const decimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
    const amountInUnits = ethers.utils.parseUnits(parsedAmount.toString(), decimals);

    try {
      const baseTokens = Object.entries(TOKENS).map(([symbol, address]) => ({
        symbol,
        address,
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
        const signerProvider = new ethers.providers.JsonRpcProvider(walletClient.transport as any);
        const signer = signerProvider.getSigner(address);
        const contract = new ethers.Contract(fromToken, ERC20_ABI, signer);
        const allowance = await contract.allowance(address, ROUTER_ADDRESS);
        const needsApproval = allowance.lt(amountInUnits);
        setApprovalNeeded((prev) => (prev !== needsApproval ? needsApproval : prev));
      } else {
        setApprovalNeeded(false);
      }
    } catch {
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, amountIn, isConnected, address, walletClient]);

  useEffect(() => {
    getQuote();
  }, [getQuote]);

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
    setAmountIn("");
    setBestPath(null);
  };

  const doSwap = useCallback(async () => {
    if (!isConnected || !quote || !bestPath || bestPath.output <= 0 || !walletClient || !address) {
      alert("⚠️ Please connect your wallet and enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;
      const isNative = fromToken === NATIVE_TOKEN_ADDRESS;

      const signerProvider = new ethers.providers.JsonRpcProvider(walletClient.transport as any);
      const signer = signerProvider.getSigner(address);

      const receipt = await TokenSwap.swap(
        signer,
        ROUTER_ADDRESS,
        bestPath,
        parseFloat(amountIn),
        inputDecimals,
        outputDecimals,
        1,
        !isNative,
        (txHash) => {
          console.log("🔁 Swap tx hash:", txHash);
        }
      );

      if (!receipt || typeof receipt.status === "undefined") {
        alert("⚠️ Swap may have completed, but no receipt was returned.");
        await fetchBalances();
        return;
      }

      if (receipt.status === 1) {
        setQuote(null);
        setBestPath(null);
        await fetchBalances();
        alert("✅ Swap completed successfully.");
      } else {
        alert("⚠️ Swap transaction failed or was reverted.");
      }
    } catch (err) {
      alert("❌ Swap failed: " + (err as Error).message);
    } finally {
      setAmountIn("");
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      setLoading(false);
    }
  }, [isConnected, amountIn, quote, bestPath, fromToken, toToken, fetchBalances, walletClient, address]);

  return {
    fromToken,
    toToken,
    amountIn,
    quote,
    loading,
    approvalNeeded,
    balances,
    isConnected,
    address,
    setFromToken,
    setToToken,
    setAmountIn,
    doSwap,
    swapTokens
  };
}
