import { Metadata } from "next";
import { getFlatFrameMetadata } from "~/lib/utils";
import ClientHome from "./ClientHome"; 

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Monport",
    openGraph: {
      title: "Monport",
      description: "Farcaster Mini App for exploring decentralized ports",
      images: ["https://monport-three.vercel.app/og.png"],
    },
    other: getFlatFrameMetadata(),
  };
}

export default function Home() {
  return <ClientHome />;
}
