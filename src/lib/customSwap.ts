import { ethers } from "ethers";
import { TokenSwap } from "@kuru-labs/kuru-sdk";
import { NATIVE_TOKEN_ADDRESS, ROUTER_ADDRESS, TOKEN_METADATA } from "./constants";

type SwapPath = {
  tx: { data: string };
  route: {
    path: string[];
    pools: string[];
  };
  output: number;
};

export async function customSwap({
  signer,
  path,
  amountIn,
  fromToken,
  toToken,
  onTx
}: {
  signer: ethers.Signer;
  path: SwapPath;
  amountIn: number;
  fromToken: string;
  toToken: string;
  onTx: (txHash: string | null) => void;
}) {
  const isNative = fromToken.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
  const inputDecimals = isNative ? 18 : TOKEN_METADATA[fromToken]?.decimals ?? 18;
  const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;

  if (isNative) {
    try {
      const tx = await signer.sendTransaction({
        to: ROUTER_ADDRESS,
        value: ethers.utils.parseUnits(amountIn.toString(), inputDecimals),
        data: path.tx.data
      });
      onTx(tx.hash);
    } catch (err) {
      console.error("❌ Native token swap failed:", err);
      onTx(null);
    }
  } else {
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
      console.error("❌ ERC20 swap failed:", err);
      onTx(null);
    }
  }
}
