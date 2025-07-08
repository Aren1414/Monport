import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metadata = {
      version: "1",
      name: "Monport",
      description: "Farcaster Mini App for exploring decentralized ports",
      iconUrl: "https://monport-three.vercel.app/icon.png",
      homeUrl: "https://monport-three.vercel.app",
      splashImageUrl: "https://monport-three.vercel.app/splash.png",
      splashBackgroundColor: "#ffffff",
      requiredChains: ["eip155:10143"],
      requiredCapabilities: ["wallet.getEvmProvider"]
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating farcaster.json:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
