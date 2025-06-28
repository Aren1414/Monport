import type { Metadata } from "next";
import Script from "next/script";
import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_OG_IMAGE_URL,
  APP_BUTTON_TEXT,
  APP_URL,
  APP_SPLASH_URL,
  APP_SPLASH_BACKGROUND_COLOR,
} from "~/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [APP_OG_IMAGE_URL],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  const frameMeta = JSON.stringify({
    version: "next",
    imageUrl: APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT ?? "Open Monport",
      action: {
        type: "launch_frame",
        url: `${APP_URL}/?tab=welcome`,
        name: APP_NAME,
        splashImageUrl: APP_SPLASH_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR ?? "#ffffff",
      },
    },
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={APP_DESCRIPTION} />
        <meta name="theme-color" content="#2266ee" />
        <title>{APP_NAME}</title>

        <meta property="fc:frame" content={frameMeta} />

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
