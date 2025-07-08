import { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="Monport" />
        <meta property="og:image" content="https://monport-three.vercel.app/og.png" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:post_url" content="https://monport-three.vercel.app/api/frame" />
        <meta name="fc:frame:image" content="https://monport-three.vercel.app/og.png" />
        <meta name="fc:frame:button:1" content="Add Mini App" />
      </head>
      <body></body>
    </html>
  `;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
