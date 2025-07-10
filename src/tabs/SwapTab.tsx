"use client";

import React from "react";
import { useWalletClient } from "wagmi";
import { writeContract } from "viem/actions";
import { useSwapLogic } from "@/features/swap/useSwapLogic";
import TokenSelect from "@/features/swap/TokenSelect";
import ERC20_ABI from "@/abis/ERC20.json";
import { ROUTER_ADDRESS, NATIVE_TOKEN_ADDRESS } from "@/lib/constants";

export default function SwapTab() {
  const {
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
    swapTokens,
    walletClient,
    getQuote
  } = useSwapLogic();

  const isAmountValid = !!amountIn && parseFloat(amountIn) > 0;
  const isNative = fromToken === NATIVE_TOKEN_ADDRESS;

  return (
    <div className="tab swap-tab" style={{ maxWidth: 420, margin: "0 auto", padding: 16, width: "100%" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>🔄 Swap</h2>

      {isConnected && (
        <div style={{ marginBottom: 16, textAlign: "center", fontSize: 14 }}>
          ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}

      {/* FROM SECTION */}
      <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontWeight: "bold" }}>From</label>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Balance: {parseFloat(balances[fromToken] || "0").toFixed(3)}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
          <TokenSelect
            value={fromToken}
            onChange={(val: string) => setFromToken(val as `0x${string}`)}
            balances={balances}
          />
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
          {[10, 20, 50, 100].map((percent) => {
            const balance = parseFloat(balances[fromToken] || "0");
            const value = (balance * percent) / 100;
            return (
              <button
                key={percent}
                onClick={() => setAmountIn(value.toFixed(6))}
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
            );
          })}
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
      <div style={{ background: "#f5f5f5", padding: 12, borderRadius: 12, marginBottom: 12 }}>
        <label style={{ fontWeight: "bold" }}>To</label>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          Balance: {parseFloat(balances[toToken] || "0").toFixed(3)}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
          <TokenSelect
            value={toToken}
            onChange={(val: string) => setToToken(val as `0x${string}`)}
            balances={balances}
          />
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
          if (!walletClient) {
            alert("❌ Wallet not connected.");
            return;
          }

          if (!isNative && approvalNeeded) {
            try {
              await writeContract(walletClient, {
                address: fromToken,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [
                  ROUTER_ADDRESS,
                  BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
                ]
              });
              alert("✅ Token approved successfully.");
              await getQuote(); // refresh state after approval
            } catch (err) {
              alert("❌ Approval failed: " + (err as Error).message);
            }
            return;
          }

          await doSwap();
        }}
        disabled={loading || !isConnected || !isAmountValid || !quote}
        style={{
          width: "100%",
          padding: 12,
          background: approvalNeeded && !isNative ? "#ffc107" : "#28a745",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: loading || !isAmountValid || !quote ? "not-allowed" : "pointer"
        }}
      >
        {loading
          ? "Processing…"
          : approvalNeeded && !isNative
          ? "Approve"
          : !isAmountValid
          ? "Enter Amount"
          : "Swap Now"}
      </button>
    </div>
  );
}
