"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import {
  PoolFetcher,
  PathFinder
} from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";

import {
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS,
  ROUTER_ADDRESS
} from "@/lib/constants";
import { KURU_ROUTER_ABI } from "@/lib/abi/kuruRouterAbi";

type KuruRoute = {
  path: string[];
  pools: { address: string }[];
};

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

    const newBalances: Record<string, string> = {};

    for (const [, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const balanceHex = await walletClient.transport.request({
          method: "eth_getBalance",
          params: [address, "latest"]
        }) as string;

        newBalances[tokenAddress.toLowerCase()] = (parseInt(balanceHex, 16) / 1e18).toString();
      } catch {
        newBalances[tokenAddress.toLowerCase()] = "0";
      }
    }

    const prev = previousBalancesRef.current;
    const changed = Object.keys(newBalances).some(
      key => newBalances[key] !== prev[key]
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

    const poolFetcher = new PoolFetcher("https://api.testnet.kuru.io");

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
        walletClient.transport,
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
        setApprovalNeeded(false);
        return;
      }

      setQuote(path.output.toString());
      setBestPath(path);
      setApprovalNeeded(fromToken !== NATIVE_TOKEN_ADDRESS);
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

      const amountInParsed = BigInt((parseFloat(amountIn) * 10 ** inputDecimals).toFixed(0));
      const minAmountOutParsed = BigInt((parseFloat(quote) * 10 ** outputDecimals).toFixed(0));

      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
      const route = bestPath as unknown as KuruRoute;

      const txHash = await writeContract(walletClient, {
        address: ROUTER_ADDRESS,
        abi: KURU_ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [
          amountInParsed,
          minAmountOutParsed,
          route.path,
          route.pools.map(p => p.address),
          address,
          BigInt(deadline)
        ]
      });

      console.log("🔁 Swap tx hash:", txHash);
      alert("✅ Swap submitted: " + txHash);
      await fetchBalances();
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
