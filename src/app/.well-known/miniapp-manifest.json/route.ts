import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "Monport",
    description: "A Farcaster Mini App for exploring decentralized ports",
    icon: "https://raw.githubusercontent.com/Aren1414/Monport/main/public/icon.png",
    url: "https://monport-three.vercel.app",
    actions: [
      {
        id: "add",
        name: "Add Mini App",
        description: "Prompt user to add this app to Warpcast",
        action: "addMiniApp"
      }
    ]
  });
}
