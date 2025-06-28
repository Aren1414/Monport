import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  return new ImageResponse(
    (
      <div tw="flex h-full w-full items-center justify-center bg-black">
        <img
          src="https://gv5vt5azz4e7rtxhmmhtrzqnx5q3f7yockked6bazjvmrr5rqgta.arweave.net/NXtZ9BnPCfjO52MPOOYNv2Gy_w4SlEH4IMpqyMexgaY"
          alt="Preview"
          tw="w-full h-full object-cover"
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
