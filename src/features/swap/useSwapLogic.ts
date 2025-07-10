"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { createPublicClient, custom } from "viem"; 
import { monadTestnet } from "wagmi/chains";
import { PoolFetcher, PathFinder, TokenSwap } from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";
import {
  TOKENS,
  TOKEN_METADATA,
  NATIVE_TOKEN_ADDRESS,
  ROUTER_ADDRESS
} from "@/lib/constants";
import { ethers } from "ethers";
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
  const [slippage, setSlippage] = useState(0.5);

  const previousBalancesRef = useRef<Record<string, string>>({});

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address || !walletClient) return;

    const publicClient = createPublicClient({
      transport: custom(walletClient.transport), 
      account: walletClient.account,
      chain: monadTestnet
    });

    const newBalances: Record<string, string> = {};

    for (const [, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const decimals = TOKEN_METADATA[tokenAddress]?.decimals ?? 18;

        if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
          const balance = await publicClient.getBalance({ address });
          newBalances[tokenAddress] = (Number(balance) / 10 ** 18).toFixed(6);
        } else {
          const balance = await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [address]
          });
          newBalances[tokenAddress] = (Number(balance) / 10 ** decimals).toFixed(6);
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
      const provider = new ethers.providers.Web3Provider(walletClient.transport);
      const poolFetcher = new PoolFetcher("https://api.testnet.kuru.io");
      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const baseTokens = Object.entries(TOKENS).map(([symbol, addr]) => ({ symbol, address: addr }));

      const pools = await poolFetcher.getAllPools(fromToken, toToken, baseTokens);
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
        setApprovalNeeded(false);
        return;
      }

      setQuote(path.output.toString());
      setBestPath(path);

      if (fromToken !== NATIVE_TOKEN_ADDRESS) {
        const signer = provider.getSigner();
        const contract = new ethers.Contract(fromToken, ERC20_ABI, signer);
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
    if (
      !isConnected ||
      !quote ||
      !bestPath ||
      bestPath.output <= 0 ||
      parsedQuote <= 0 ||
      !address ||
      !walletClient
    ) {
      alert("❌ Swap aborted. Missing quote or connection.");
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(walletClient.transport);
      const signer = provider.getSigner();

      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;
      const isNative = fromToken === NATIVE_TOKEN_ADDRESS;

      const receipt = await TokenSwap.swap(
        signer,
        ROUTER_ADDRESS,
        bestPath,
        parseFloat(amountIn),
        inputDecimals,
        outputDecimals,
        slippage,
        !isNative,
        (txHash) => {
          console.log("🔁 Swap tx hash:", txHash);
        }
      );

      console.log("📦 Swap receipt:", receipt);

      if (receipt?.status === 1) {
        await fetchBalances();
        alert("✅ Swap completed successfully.");
      } else {
        alert("⚠️ Swap failed or was reverted.");
      }
    } catch (err) {
      console.error("❌ Swap error:", err);
      alert("❌ Swap failed: " + (err as Error).message);
    } finally {
      setAmountIn("");
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      setLoading(false);
    }
  }, [isConnected, amountIn, quote, bestPath, fromToken, toToken, fetchBalances, walletClient, slippage, address]);

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
