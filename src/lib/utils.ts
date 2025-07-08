import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { mnemonicToAccount } from "viem/accounts";
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_SPLASH_URL,
  APP_SPLASH_BACKGROUND_COLOR,
} from "./constants";

// ---------- Types ----------

interface FrameMetadata {
  version: string;
  name: string;
  iconUrl: string;
  homeUrl: string;
  imageUrl?: string;
  buttonTitle?: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  webhookUrl?: string;
  description?: string;
  primaryCategory?: string;
  tags?: string[];
}

interface FrameManifest {
  accountAssociation?: {
    header: string;
    payload: string;
    signature: string;
  };
  frame: FrameMetadata;
}

// ---------- Utility ----------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecretEnvVars() {
  const seedPhrase = process.env.SEED_PHRASE;
  const fid = process.env.FID;

  if (!seedPhrase || !fid) return null;

  return { seedPhrase, fid };
}

// ---------- Frame Metadata for <head> (for Warpcast) ----------

export function getFlatFrameMetadata(): Record<string, string> {
  return {
    "fc:frame": "vNext",
    "fc:frame:image": APP_OG_IMAGE_URL,
    "fc:frame:button:1": APP_BUTTON_TEXT ?? "Open Monport",
    "fc:frame:post_url": `${APP_URL}/api/frame`, 
  };
}

// ---------- Frame Embed Metadata (for internal use or legacy) ----------

export function getFrameEmbedMetadata(imageUrl?: string) {
  return {
    version: "next",
    imageUrl: imageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT ?? "Open MonPort",
      action: {
        type: "launch_frame",
        url: `${APP_URL}/api/frame`, 
        name: APP_NAME ?? "MonPort",
        splashImageUrl: APP_SPLASH_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR ?? "#ffffff",
      },
    },
  };
}

// ---------- Frame Manifest (signed if available) ----------

export async function getFarcasterMetadata(): Promise<FrameManifest> {
  if (process.env.FRAME_METADATA) {
    try {
      const metadata = JSON.parse(process.env.FRAME_METADATA);
      console.log("Using pre-signed frame metadata from environment");
      return metadata;
    } catch (error) {
      console.warn("Failed to parse FRAME_METADATA from environment:", error);
    }
  }

  if (!APP_URL) {
    throw new Error("NEXT_PUBLIC_URL not configured");
  }

  const domain = new URL(APP_URL).hostname;
  console.log("Using domain for manifest:", domain);

  const secretEnvVars = getSecretEnvVars();
  if (!secretEnvVars) {
    console.warn("No seed phrase or FID found in environment variables — generating unsigned metadata");
  }

  let accountAssociation;
  if (secretEnvVars) {
    const account = mnemonicToAccount(secretEnvVars.seedPhrase);
    const custodyAddress = account.address;

    const header = {
      fid: parseInt(secretEnvVars.fid),
      type: "custody",
      key: custodyAddress,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header), "utf-8").toString("base64");

    const payload = {
      domain,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), "utf-8").toString("base64url");

    const signature = await account.signMessage({
      message: `${encodedHeader}.${encodedPayload}`,
    });
    const encodedSignature = Buffer.from(signature, "utf-8").toString("base64url");

    accountAssociation = {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature,
    };
  }

  return {
    accountAssociation,
    frame: {
      version: "1",
      name: APP_NAME ?? "MonPort",
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      imageUrl: APP_OG_IMAGE_URL,
      buttonTitle: APP_BUTTON_TEXT ?? "Launch",
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
    },
  };
}
