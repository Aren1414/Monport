import type { Metadata } from "next";
import Script from "next/script";
import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_OG_IMAGE_URL,
  APP_URL,
} from "~/lib/constants";
import { AddMiniAppPrompt } from "~/components/AddMiniAppPrompt";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="theme-color" content="#2266ee" />
        <title>{APP_NAME}</title>

        {/* ✅ Open Graph metadata for Warpcast preview */}
        <meta property="og:title" content={APP_NAME} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:image" content={APP_OG_IMAGE_URL} />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />

        {/* ✅ Farcaster Mini App metadata */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content={APP_OG_IMAGE_URL} />
        <meta name="fc:frame:post_url" content={`${APP_URL}/api/frame`} />
        <meta name="fc:frame:button:1" content="Add Mini App" />

        {/* ✅ Load Farcaster Mini App SDK */}
        <Script
          src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://miniapps.farcaster.xyz/sdk/v0"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Providers session={session}>
          <AddMiniAppPrompt />
          {children}
        </Providers>
      </body>
    </html>
  );
}
