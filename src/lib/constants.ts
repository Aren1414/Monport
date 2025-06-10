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
export const APP_WEBHOOK_URL = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID 
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;

// Smart Contract Addresses
export const WELCOME_NFT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
export const MONPORT_FACTORY_ADDRESS = "0x3FFA88641129f4Ac39287Bd2768A165Ac6055e31";

// Import ABIs
import WelcomeNFT_ABI from "./WelcomeNFT.json";
import MonPortFactory_ABI from "./MonPortFactory.json";

// Export ABIs
export const WELCOME_NFT_ABI = WelcomeNFT_ABI;
export const MONPORT_FACTORY_ABI = MonPortFactory_ABI;
