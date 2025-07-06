"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers, utils as ethersUtils } from "ethers";
import { useAccount, useConnect } from "wagmi";
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
import type { EthereumWindow } from "./types";

const KURU_API_URL = "https://api.testnet.kuru.io";

export function useSwapLogic() {
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pairs }),
          }
        );

        const data = (await response.json()) as {
          data: { baseasset: { address: string; image?: string }; quoteasset: { address: string; image?: string } }[];
        };

        data.data.forEach(({ baseasset, quoteasset }) => {
          if (baseasset?.address && baseasset?.image)
            logos[ethersUtils.getAddress(baseasset.address)] = baseasset.image;
          if (quoteasset?.address && quoteasset?.image)
            logos[ethersUtils.getAddress(quoteasset.address)] = quoteasset.image;
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

  provider.on("block", fetchBalances);
  return () => {
    provider.off("block", fetchBalances);
  };
}, [isConnected, address, fetchBalances]);
  
  useEffect(() => {
    const ethereum = (window as EthereumWindow).ethereum;
    if (!ethereum) return;

    ethereum.on("accountsChanged", fetchBalances);
    ethereum.on("chainChanged", fetchBalances);

    return () => {
      ethereum.removeListener("accountsChanged", fetchBalances);
      ethereum.removeListener("chainChanged", fetchBalances);
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
      const baseTokens = Object.entries(TOKENS).map(([symbol, address]) => ({ symbol, address }));
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

        const needsApproval = allowance.lt(amountInUnits);
        setApprovalNeeded((prev) => (prev !== needsApproval ? needsApproval : prev));
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

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setQuote(null);
    setAmountIn("");
    setBestPath(null);
  };

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

  return {
    fromToken,
    toToken,
    amountIn,
    quote,
    loading,
    approvalNeeded,
    balances,
    tokenLogos,
    isConnected,
    address,
    setFromToken,
    setToToken,
    setAmountIn,
    doSwap,
    swapTokens,
    connect,
    connectors
  };
}
