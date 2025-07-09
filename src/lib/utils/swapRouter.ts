import { ethers } from "ethers";
import { KURU_ROUTER_ABI } from "@/lib/abi/kuruRouterAbi";
import { ROUTER_ADDRESS } from "@/lib/constants";
import { TOKEN_METADATA, NATIVE_TOKEN_ADDRESS } from "@/lib/constants";

export async function performSwap({
  signer,
  fromToken,
  toToken,
  amountIn,
  bestPath,
}: {
  signer: ethers.Signer;
  fromToken: string;
  toToken: string;
  amountIn: number;
  bestPath: {
    path: string[];
    pools: string[];
    output: number;
  };
}) {
  const router = new ethers.Contract(ROUTER_ADDRESS, KURU_ROUTER_ABI, signer);

  const inputDecimals = TOKEN_METADATA[fromToken]?.decimals ?? 18;
  const outputDecimals = TOKEN_METADATA[toToken]?.decimals ?? 18;
  const amountInUnits = ethers.utils.parseUnits(amountIn.toString(), inputDecimals);
  const minAmountOutUnits = ethers.utils.parseUnits(
    (bestPath.output * 0.99).toFixed(6), // slippage 1%
    outputDecimals
  );

  const tx = await router.swapExactTokensForTokens(
    amountInUnits,
    minAmountOutUnits,
    bestPath.path,
    bestPath.pools,
    await signer.getAddress(),
    Math.floor(Date.now() / 1000) + 1800 // deadline: 30 min
  );

  console.log("🔁 Swap tx sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Swap confirmed:", receipt.transactionHash);

  return receipt;
}
