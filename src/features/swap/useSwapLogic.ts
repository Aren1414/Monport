"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import { ethers } from "ethers";
import { PoolFetcher, PathFinder } from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";
import {
  TOKEN_METADATA,
  TOKENS,
  NATIVE_TOKEN_ADDRESS,
  ROUTER_ADDRESS,
  RPC_URL
} from "@/lib/constants";
import { KURU_ROUTER_ABI } from "@/lib/abi/kuruRouterAbi";
import ERC20_ABI from "@/abis/ERC20.json";

type KuruRouteLike = {
  path?: string[];
  pools?: { address: string }[];
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
  const [slippage, setSlippage] = useState(1);

  const previousBalancesRef = useRef<Record<string, string>>({});

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address || !walletClient) return;
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const newBalances: Record<string, string> = {};

    for (const [, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const normalized = ethers.utils.getAddress(tokenAddress) as `0x${string}`;
        const decimals = TOKEN_METADATA[normalized]?.decimals ?? 18;

        if (normalized === NATIVE_TOKEN_ADDRESS) {
          const balance = await provider.getBalance(address);
          newBalances[normalized] = ethers.utils.formatEther(balance);
        } else {
          const contract = new ethers.Contract(normalized, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          newBalances[normalized] = ethers.utils.formatUnits(balance, decimals);
        }
      } catch {
        newBalances[tokenAddress] = "0";
      }
    }

    const changed = Object.keys(newBalances).some(
      (key) => newBalances[key] !== previousBalancesRef.current[key]
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
    try {
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const poolFetcher = new PoolFetcher("https://api.testnet.kuru.io");

      const fromAddress = ethers.utils.getAddress(fromToken) as `0x${string}`;
      const toAddress = ethers.utils.getAddress(toToken) as `0x${string}`;
      const inputDecimals = TOKEN_METADATA[fromAddress]?.decimals ?? 18;
      const baseTokens = Object.entries(TOKENS).map(([symbol, addr]) => ({
        symbol,
        address: ethers.utils.getAddress(addr) as `0x${string}`
      }));

      const pools = await poolFetcher.getAllPools(fromAddress, toAddress, baseTokens);
      const path = await PathFinder.findBestPath(provider, fromAddress, toAddress, parsedAmount, "amountIn", poolFetcher, pools);

      if (!path || path.output <= 0) {
        setQuote(null);
        setBestPath(null);
        setApprovalNeeded(false);
        return;
      }

      setQuote(path.output.toString());
      setBestPath(path);

      if (fromAddress !== NATIVE_TOKEN_ADDRESS) {
        const signer = provider.getSigner(address);
        const contract = new ethers.Contract(fromAddress, ERC20_ABI, signer);
        const parsedAmountIn = ethers.utils.parseUnits(parsedAmount.toString(), inputDecimals);
        const allowance = await contract.allowance(address, ROUTER_ADDRESS);
        setApprovalNeeded(allowance.lt(parsedAmountIn));
      } else {
        setApprovalNeeded(false);
      }
    } catch (err) {
      console.error("❌ getQuote error:", err);
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
    const parsedQuote = parseFloat(quote ?? "0");
    if (!isConnected || !quote || !bestPath || bestPath.output <= 0 || parsedQuote <= 0 || !walletClient || !address) {
      alert("❌ Swap aborted. Missing quote or connection.");
      return;
    }

    setLoading(true);
    try {
      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;
      const amountInParsed = BigInt(ethers.utils.parseUnits(amountIn, inputDecimals).toString());
      const slippageFactor = 1 - slippage / 100;
      const minAmountOutParsed = BigInt(
        ethers.utils.parseUnits((parsedQuote * slippageFactor).toFixed(6), outputDecimals).toString()
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const isNative = fromToken === NATIVE_TOKEN_ADDRESS;

      const { path: rawPath = [], pools = [] } = bestPath as KuruRouteLike;
      const routePath = rawPath.map((addr) => ethers.utils.getAddress(addr)) as `0x${string}`[];
      const poolAddresses = pools.map((p) => ethers.utils.getAddress(p.address)) as `0x${string}`[];

      console.log("🔍 Swap Params:");
      console.log("amountInParsed:", amountInParsed.toString());
      console.log("minAmountOutParsed:", minAmountOutParsed.toString());
      console.log("routePath:", routePath);
      console.log("poolAddresses:", poolAddresses);
      console.log("isNative:", isNative);

      const txHash = await writeContract(walletClient, {
        address: ROUTER_ADDRESS,
        abi: KURU_ROUTER_ABI,
        functionName: isNative ? "swapExactETHForTokens" : "swapExactTokensForTokens",
        args: isNative
          ? [minAmountOutParsed, routePath, poolAddresses, address, deadline]
          : [amountInParsed, minAmountOutParsed, routePath, poolAddresses, address, deadline],
        ...(isNative ? { value: amountInParsed } : {})
      });

      console.log("🔁 Swap tx hash:", txHash);
      alert("✅ Swap submitted: " + txHash);
      await fetchBalances();
    } catch (err) {
      console.error("❌ Swap failed:", err);
      alert("❌ Swap failed: " + (err as Error).message);
    } finally {
      setAmountIn("");
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      setLoading(false);
    }
  }, [
    isConnected,
    amountIn,
    quote,
    bestPath,
    fromToken,
    toToken,
    fetchBalances,
    walletClient,
    slippage,
    address
  ]);

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
    walletClient,
    slippage,
    setSlippage,
    setFromToken,
    setToToken,
    setAmountIn,
    doSwap,
    swapTokens,
    getQuote
  };
}
