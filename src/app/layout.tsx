import type { Metadata } from "next";
import { getSession } from "~/auth";
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { APP_NAME, APP_DESCRIPTION } from "~/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
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
        <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
