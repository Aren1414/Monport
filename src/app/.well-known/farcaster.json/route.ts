import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const metadata = {
      accountAssociation: {
        required: true
      },
      miniapp: {
        name: "Monport",
        description: "A Farcaster Mini App for exploring decentralized ports",
        icon: "https://raw.githubusercontent.com/Aren1414/Monport/main/public/icon.png",
        url: "https://monport-three.vercel.app"
      }
    };

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
