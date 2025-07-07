import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metadata = {
      frame: {
        version: "1",
        name: "Monport",
        description: "A Farcaster Mini App for exploring decentralized ports",
        iconUrl: "https://raw.githubusercontent.com/Aren1414/Monport/main/public/icon.png",
        homeUrl: "https://monport-three.vercel.app",
        splashImageUrl: "https://monport-three.vercel.app/splash.png",
        splashBackgroundColor: "#ffffff",
        requiredChains: ["eip155:10143"],
        requiredCapabilities: ["wallet.getEvmProvider"]
      }
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating farcaster.json:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
