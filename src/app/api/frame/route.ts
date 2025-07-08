import { NextRequest } from "next/server";
import { getFrameHtmlResponse } from "@farcaster/next";

export async function POST(req: NextRequest) {
  return new Response(
    getFrameHtmlResponse({
      image: "https://monport-three.vercel.app/og.png",
      postUrl: "https://monport-three.vercel.app/api/frame",
      buttons: [{ label: "Add Mini App" }],
    }),
    {
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}
