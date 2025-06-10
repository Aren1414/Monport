"use client";

import { Metadata } from "next";
import { useRouter } from "next/navigation";
import WelcomeTab from "~/components/WelcomeTab";
import SwapTab from "~/components/SwapTab";
import DeployTab from "~/components/DeployTab";
import ProfileTab from "~/components/ProfileTab";
import LeaderboardTab from "~/components/LeaderboardTab";
import { APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL } from "~/lib/constants";
import { getFrameEmbedMetadata } from "~/lib/utils";
import "~/styles/App.css";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: APP_NAME,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [APP_OG_IMAGE_URL],
    },
    other: {
      "fc:frame": JSON.stringify(getFrameEmbedMetadata()),
    },
  };
}

export default function Home() {
  const router = useRouter();
  const tab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;

  const renderTab = () => {
    switch (tab) {
      case "swap":
        return <SwapTab />;
      case "deploy":
        return <DeployTab />;
      case "profile":
        return <ProfileTab />;
      case "leaderboard":
        return <LeaderboardTab />;
      default:
        return <WelcomeTab />;
    }
  };

  return (
    <div className="app-container">
      <main className="tab-content">{renderTab()}</main>

      <nav className="tab-navigation">
        <button onClick={() => router.push("/?tab=profile")}>Profile</button>
        <button onClick={() => router.push("/?tab=swap")}>Swap</button>
        <button onClick={() => router.push("/?tab=welcome")}>Welcome</button>
        <button onClick={() => router.push("/?tab=deploy")}>Deploy</button>
        <button onClick={() => router.push("/?tab=leaderboard")}>Leaderboard</button>
      </nav>
    </div>
  );
}
