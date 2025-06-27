import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_URL, APP_NAME, APP_DESCRIPTION } from "~/lib/constants";
import { getFrameEmbedMetadata } from "~/lib/utils";

export const revalidate = 300;

type Props = {
  params: {
    fid: string;
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const imageUrl = `${APP_URL}/api/opengraph-image?fid=${params.fid}`;

  return {
    title: `${APP_NAME} - Share`,
    description: APP_DESCRIPTION,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [imageUrl],
      url: `${APP_URL}/share/${params.fid}`,
      type: "website",
    },
    other: {
      "fc:frame": JSON.stringify(
        getFrameEmbedMetadata(imageUrl, `${APP_URL}/?fid=${params.fid}`)
      ),
    },
  };
}

export default function SharePage() {
  redirect(`/?fid=shared`);
}
