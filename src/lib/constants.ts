import { utils as ethersUtils } from "ethers";

// App Metadata
export const APP_URL = process.env.NEXT_PUBLIC_URL ?? "";
export const APP_NAME = process.env.NEXT_PUBLIC_FRAME_NAME ?? "MonPort";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_FRAME_DESCRIPTION ?? "";
export const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY ?? "Utility";
export const APP_TAGS = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(",") ?? ["monad", "swap", "nft"];
export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = "#f7f7f7";
export const APP_BUTTON_TEXT = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT ?? "Launch";
export const APP_WEBHOOK_URL =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;

// Monad Testnet Network Configuration
export const MONAD_CHAIN_ID = 10143;
export const MONAD_CHAIN_PARAMS = {
  chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
};

// Export Monad RPC URL for SDK usage
export const RPC_URL = MONAD_CHAIN_PARAMS.rpcUrls[0];

// ✅ Native Token Address (used as placeholder for native token in SDKs)
export const NATIVE_TOKEN_ADDRESS: `0x${string}` = "0x0000000000000000000000000000000000000000";

// ✅ Kuru Router Address (used in swap tx)
export const ROUTER_ADDRESS: `0x${string}` = "0xc816865f172d640d93712C68a7E1F83F3fA63235";

// ✅ Token Addresses on Monad Testnet (checksum format)
export const TOKENS: Readonly<Record<string, `0x${string}`>> = Object.freeze({
  MON: NATIVE_TOKEN_ADDRESS,
  USDC: ethersUtils.getAddress("0xf817257fed379853cDe0fa4F97AB987181B1E5Ea") as `0x${string}`,
  USDT: ethersUtils.getAddress("0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D") as `0x${string}`,
  DAK: ethersUtils.getAddress("0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714") as `0x${string}`,
  CHOG: ethersUtils.getAddress("0xE0590015A873bF326bd645c3E1266d4db41C4E6B") as `0x${string}`,
  YAKI: ethersUtils.getAddress("0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50") as `0x${string}`,
});

// ✅ Token Metadata (ERC20 decimals only)
export const TOKEN_METADATA: Readonly<Record<`0x${string}`, { decimals: number }>> = Object.freeze({
  [TOKENS.USDC]: { decimals: 6 },
  [TOKENS.USDT]: { decimals: 6 },
  [TOKENS.DAK]: { decimals: 18 },
  [TOKENS.CHOG]: { decimals: 18 },
  [TOKENS.YAKI]: { decimals: 18 },
  [TOKENS.MON]: { decimals: 18 }, 
});

// Smart Contract Addresses (⛔ NOT used in swap)
export const WELCOME_NFT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
export const MONPORT_FACTORY_ADDRESS = "0x3FFA88641129f4Ac39287Bd2768A165Ac6055e31";

// Import ABIs
import WelcomeNFT_ABI from "~/abis/WelcomeNFT.json";
import MonPortFactory_ABI from "./MonPortFactory.json";

// Export ABIs
export const WELCOME_NFT_ABI = WelcomeNFT_ABI;
export const MONPORT_FACTORY_ABI = MonPortFactory_ABI;
