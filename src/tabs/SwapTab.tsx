"use client";

import React from "react";
import { useToast } from "@/hooks/useToast";
import { useSwapLogic } from "@/features/swap/useSwapLogic";
import TokenSelect from "@/features/swap/TokenSelect";
import ERC20_ABI from "@/abis/ERC20.json";
import { ROUTER_ADDRESS } from "@/lib/constants";
import { ethers } from "ethers";

export default function SwapTab() {
  const {
    fromToken, toToken, amountIn, quote,
    loading, approvalNeeded, balances,
    isConnected, address, walletClient,
    setFromToken, setToToken, setAmountIn,
    doSwap, swapTokens, getQuote, markApprovalAsDone
  } = useSwapLogic();

  const toast = useToast();

  const isAmountValid = !!amountIn && parseFloat(amountIn) > 0;

  return (
    <div className="tab swap-tab" style={{ maxWidth: 420, margin: "0 auto", padding: 16, width: "100%" }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>🔄 Swap</h2>

      {isConnected && (
        <div style={{ marginBottom: 16, textAlign: "center", fontSize: 14 }}>
          ✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}

      {/* From Token Section */}
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

      {/* Swap Direction Toggle */}
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

      {/* To Token Section */}
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

      {/* Approve & Swap Button */}
      <button
        onClick={async () => {
          if (!isConnected || !address || !walletClient) {
            toast("❌ Wallet not connected", "error", 6000);
            return;
          }

          if (approvalNeeded) {
            try {
              const iface = new ethers.utils.Interface(ERC20_ABI);
              const data = iface.encodeFunctionData("approve", [
                ROUTER_ADDRESS,
                ethers.constants.MaxUint256
              ]);

              const tx = {
                from: address,
                to: fromToken,
                data
              };

              const hash = await walletClient.transport.request({
                method: "eth_sendTransaction",
                params: [tx]
              });

              console.log("🧾 Approval tx:", hash);
              toast("✅ Token approved successfully", "success", 3000);
              markApprovalAsDone();
              await getQuote();
            } catch {
              toast("❌ Approval failed", "error", 6000);
            }
            return;
          }

          await doSwap(); 
        }}
        disabled={loading || !isConnected || !isAmountValid || !quote}
        style={{
          width: "100%",
          padding: 12,
          background: approvalNeeded ? "#ffc107" : "#28a745",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: loading || !isAmountValid || !quote ? "not-allowed" : "pointer"
        }}
      >
        {loading
          ? "Processing…"
          : !isAmountValid
          ? "Enter Amount"
          : approvalNeeded
          ? "Approve"
          : "Swap Now"}
      </button>
    </div>
  );
}
