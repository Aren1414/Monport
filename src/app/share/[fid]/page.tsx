import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { APP_URL, APP_NAME, APP_DESCRIPTION } from "~/lib/constants";

export const revalidate = 300;

export async function generateMetadata(props: any): Promise<Metadata> {
  const { fid } = props.params;
  const imageUrl = `${APP_URL}/api/opengraph-image?fid=${fid}`;

  const frame = {
    version: "next",
    imageUrl,
    button: {
      title: "Open MonPort",
      action: {
        type: "launch_frame",
        url: `${APP_URL}/?tab=welcome`,
        name: APP_NAME,
        splashImageUrl: `${APP_URL}/logo.png`,
        splashBackgroundColor: "#ffffff",
      },
    },
  };

  return {
    title: `${APP_NAME} - Share`,
    description: APP_DESCRIPTION,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [imageUrl],
      url: `${APP_URL}/share/${fid}`,
      type: "website",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function SharePage() {
  redirect("/");
}
