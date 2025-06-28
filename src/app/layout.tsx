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
  APP_BUTTON_TEXT,
} from "~/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [APP_OG_IMAGE_URL],
    url: APP_URL,
    type: "website",
  },
};

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

        {/* Open Graph */}
        <meta property="og:title" content={APP_NAME} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="og:image" content={APP_OG_IMAGE_URL} />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />

        {/* Farcaster Frame Metadata */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={APP_OG_IMAGE_URL} />
        <meta property="fc:frame:button:1" content={APP_BUTTON_TEXT ?? "Open MonPort"} />
        <meta property="fc:frame:url" content={APP_URL} />

        <Script
          src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
