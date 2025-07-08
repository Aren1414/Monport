import { Metadata } from "next";
import ClientHome from "./ClientHome";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Monport",
  description: "Farcaster Mini App for exploring decentralized ports",
  openGraph: {
    title: "Monport",
    description: "Farcaster Mini App for exploring decentralized ports",
    images: [
      {
        url: "https://monport-three.vercel.app/og.png",
        width: 1200,
        height: 630,
        alt: "Monport Preview",
      },
    ],
    url: "https://monport-three.vercel.app",
    type: "website",
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://monport-three.vercel.app/og.png",
    "fc:frame:post_url": "https://monport-three.vercel.app/api/frame",
    "fc:frame:button:1": "Add Mini App",
  },
};

export default function Home() {
  return <ClientHome />;
}
