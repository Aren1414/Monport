import { ImageResponse } from "next/og";

// export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const imageUrl =
    "https://gv5vt5azz4e7rtxhmmhtrzqnx5q3f7yockked6bazjvmrr5rqgta.arweave.net/NXtZ9BnPCfjO52MPOOYNv2Gy_w4SlEH4IMpqyMexgaY";

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
