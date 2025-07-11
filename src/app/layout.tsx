import type { Metadata } from "next";
import Script from "next/script";
import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { ToastProvider } from "@/hooks/useToast";
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

  const frameMeta = JSON.stringify({
    version: "next",
    imageUrl: APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT ?? "Open MonPort",
      action: {
        type: "launch_frame",
        url: `${APP_URL}/?tab=welcome`,
        name: APP_NAME,
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: "#ffffff",
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
        <Providers session={session}>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
