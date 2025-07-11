"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWalletClient } from "wagmi";
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

    const provider = new ethers.providers.JsonRpcProvider(monadTestnet.rpcUrls.default.http[0]);
    const newBalances: Record<string, string> = {};

    for (const [, tokenAddress] of Object.entries(TOKENS)) {
      try {
        const decimals = TOKEN_METADATA[tokenAddress]?.decimals ?? 18;
        if (tokenAddress === NATIVE_TOKEN_ADDRESS) {
          const balance = await provider.getBalance(address);
          newBalances[tokenAddress] = ethers.utils.formatUnits(balance, 18);
        } else {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          newBalances[tokenAddress] = ethers.utils.formatUnits(balance, decimals);
        }
      } catch (err) {
        console.error(`❌ Error fetching balance for ${tokenAddress}:`, err);
        newBalances[tokenAddress] = "0";
      }
    }

    const changed = Object.keys(newBalances).some(
      key => newBalances[key] !== previousBalancesRef.current[key]
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
    if (
      !fromToken || !toToken ||
      isNaN(parsedAmount) || parsedAmount <= 0 ||
      !isConnected || !address
    ) {
      setQuote(null);
      setBestPath(null);
      setApprovalNeeded(false);
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.JsonRpcProvider(monadTestnet.rpcUrls.default.http[0]);
      const poolFetcher = new PoolFetcher("https://api.testnet.kuru.io");
      const baseTokens = Object.entries(TOKENS).map(([symbol, addr]) => ({
        symbol,
        address: addr
      }));

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
      setApprovalNeeded(fromToken !== NATIVE_TOKEN_ADDRESS);
    } catch (err) {
      console.error("❌ getQuote error:", err);
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

  const swapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setQuote(null);
    setAmountIn("");
    setBestPath(null);
  };

  const markApprovalAsDone = () => {
    setApprovalNeeded(false);
  };

  const doSwap = useCallback(async () => {
    const parsedQuote = parseFloat(quote ?? "0");
    if (
      !isConnected || !walletClient || !quote ||
      !bestPath || bestPath.output <= 0 ||
      parsedQuote <= 0 || !address
    ) {
      alert("❌ Swap aborted. Missing quote or connection.");
      return;
    }

    setLoading(true);
    try {
      const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
      const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

      const tokenInAmount = ethers.utils.parseUnits(amountIn, inputDecimals);
      const clippedOutput = (bestPath.output * (100 - slippage)) / 100;
      const minTokenOutAmount = ethers.utils.parseUnits(
        clippedOutput.toFixed(outputDecimals),
        outputDecimals
      );

      const provider = new ethers.providers.JsonRpcProvider(monadTestnet.rpcUrls.default.http[0]);
      const signer = provider.getSigner(address); 

      const txRaw = await TokenSwap.constructSwapTransaction(
        signer,
        ROUTER_ADDRESS,
        bestPath,
        tokenInAmount,
        minTokenOutAmount,
        {}
      );

      
      const hash = await walletClient.transport.request({
        method: "eth_sendTransaction",
        params: [{
          from: txRaw.from,
          to: txRaw.to,
          data: txRaw.data,
          value: ethers.BigNumber.from(txRaw.value ?? "0").toHexString()
        }]
      });

      console.log("📦 Swap tx hash:", hash);
      alert("✅ Swap submitted. Check wallet for confirmation.");
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
  }, [isConnected, walletClient, amountIn, quote, bestPath, fromToken, toToken, slippage, address]);

  return {
    fromToken, toToken, amountIn, quote,
    loading, approvalNeeded, balances,
    isConnected, address, walletClient, slippage,
    setSlippage, setFromToken, setToToken, setAmountIn,
    doSwap, swapTokens, getQuote, markApprovalAsDone
  };
}
