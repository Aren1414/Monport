// App Metadata
export const APP_URL = process.env.NEXT_PUBLIC_URL!;
export const APP_NAME = process.env.NEXT_PUBLIC_FRAME_NAME;
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_FRAME_DESCRIPTION;
export const APP_PRIMARY_CATEGORY = process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY;
export const APP_TAGS = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');
export const APP_ICON_URL = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = "#f7f7f7";
export const APP_BUTTON_TEXT = process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT;
export const APP_WEBHOOK_URL =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;

// Monad Testnet Network Configuration
export const MONAD_CHAIN_ID = 10143;
export const MONAD_CHAIN_PARAMS = {
  chainId: `0x${MONAD_CHAIN_ID.toString(16)}`, // Hex format
  chainName: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz/"],
  blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
};
export const RPC_URL = MONAD_CHAIN_PARAMS.rpcUrls[0];

// Kuru Router Address (from official docs)
export const ROUTER_ADDRESS = "0xc816865f172d640d93712C68a7E1F83F3fA63235";

// Token Addresses on Monad Testnet (from Kuru documentation)
export const TOKENS = {
  MON: "0x0000000000000000000000000000000000000000", // Native token
  USDC: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  USDT: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
  DAK: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  CHOG: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  YAKI: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
};

// Token Metadata: decimals per token
export const TOKEN_METADATA: Record<string, { decimals: number }> = {
  [TOKENS.MON]: { decimals: 18 },
  [TOKENS.USDC]: { decimals: 6 },
  [TOKENS.USDT]: { decimals: 6 },
  [TOKENS.DAK]: { decimals: 18 },
  [TOKENS.CHOG]: { decimals: 18 },
  [TOKENS.YAKI]: { decimals: 18 },
};

// Smart Contract Addresses
export const WELCOME_NFT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
export const MONPORT_FACTORY_ADDRESS = "0x3FFA88641129f4Ac39287Bd2768A165Ac6055e31";

// Import ABIs
import WelcomeNFT_ABI from "~/abis/WelcomeNFT.json";
import MonPortFactory_ABI from "./MonPortFactory.json";

// Export ABIs
export const WELCOME_NFT_ABI = WelcomeNFT_ABI;
export const MONPORT_FACTORY_ABI = MonPortFactory_ABI;
