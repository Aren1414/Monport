import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";

export async function GET() {
  const imageUrl =
    "https://mhz5j3u6p57zkqjpwsz5kixyp37p7vkwqoetwxbtzgjof6fyysgq.arweave.net/YfPU7p5_f5VBL7Sz1SL4fv7_1VaDiTtcM8mS4vi4xI0";

  return new ImageResponse(
    (
      <img
        src={imageUrl}
        alt="Preview"
        style={{
          width: "1536px",
          height: "1024px",
          objectFit: "cover",
        }}
      />
    ),
    {
      width: 1536,
      height: 1024,
    }
  );
}
