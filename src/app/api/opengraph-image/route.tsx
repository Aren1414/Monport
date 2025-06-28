import { ImageResponse } from "next/og";

// export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const imageUrl =
  "https://mhz5j3u6p57zkqjpwsz5kixyp37p7vkwqoetwxbtzgjof6fyysgq.arweave.net/YfPU7p5_f5VBL7Sz1SL4fv7_1VaDiTtcM8mS4vi4xI0";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "black",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Preview"
          width={1024}
          height={1024}
          style={{
            width: "1024px",
            height: "1024px",
            objectFit: "cover",
            borderRadius: "32px",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
