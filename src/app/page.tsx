"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import WelcomeTab from "~/components/tabs/WelcomeTab";
import SwapTab from "~/components/tabs/SwapTab";
import DeployTab from "~/components/tabs/DeployTab";
import ProfileTab from "~/components/tabs/ProfileTab";
import LeaderboardTab from "~/components/tabs/LeaderboardTab";
import "~/styles/App.css";

export default function Home() {
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [tab, setTab] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentTab = new URLSearchParams(window.location.search).get("tab");
      setTab(currentTab);
    }
  }, []);

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
      case "welcome":
      default:
        return <WelcomeTab />;
    }
  };

  const changeTab = (target: string) => {
    router.push(`/?tab=${target}`);
    setTab(target);
  };

  return (
    <div className="app-container">
      <main className="tab-content">{renderTab()}</main>

      <nav className="tab-navigation">
        <button onClick={() => changeTab("welcome")}>🏠 Welcome</button>
        <button onClick={() => changeTab("swap")}>🔄 Swap</button>
        <button onClick={() => changeTab("deploy")}>🚀 Deploy</button>
        <button onClick={() => changeTab("profile")}>👤 Profile</button>
        <button onClick={() => changeTab("leaderboard")}>🏆 Leaderboard</button>
      </nav>
    </div>
  );
}
