import { ethers } from "ethers";
import { TokenSwap } from "@kuru-labs/kuru-sdk";
import type { RouteOutput } from "@kuru-labs/kuru-sdk";
import { NATIVE_TOKEN_ADDRESS, ROUTER_ADDRESS, TOKEN_METADATA } from "./constants";

export async function customSwap({
  signer,
  path,
  amountIn,
  fromToken,
  toToken,
  onTx
}: {
  signer: ethers.Signer;
  path: RouteOutput;
  amountIn: number;
  fromToken: string;
  toToken: string;
  onTx: (txHash: string | null) => void;
}) {
  const isNative = fromToken.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  const inputDecimals = isNative ? 18 : TOKEN_METADATA[fromToken]?.decimals ?? 18;
  const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

  try {
    await TokenSwap.swap(
      signer,
      ROUTER_ADDRESS,
      path,
      amountIn,
      inputDecimals,
      outputDecimals,
      true,
      onTx
    );
  } catch (err) {
    console.error("❌ Swap failed:", err);
    onTx(null);
  }
}
