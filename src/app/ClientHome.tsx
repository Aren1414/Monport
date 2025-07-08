"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WelcomeTab from "~/tabs/WelcomeTab";
import SwapTab from "~/tabs/SwapTab";
import DeployTab from "~/tabs/DeployTab";
import LeaderboardTab from "~/tabs/LeaderboardTab";
import "~/styles/App.css";

export default function ClientHome() {
  const router = useRouter();
  const [tab, setTab] = useState<string>("welcome");

  useEffect(() => {
    const currentTab = new URLSearchParams(window.location.search).get("tab");
    if (currentTab) setTab(currentTab);
  }, []);

  const renderTab = () => {
    switch (tab) {
      case "swap":
        return <SwapTab />;
      case "deploy":
        return <DeployTab />;
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
        <button onClick={() => changeTab("welcome")}>Welcome</button>
        <button onClick={() => changeTab("swap")}>Swap</button>
        <button onClick={() => changeTab("deploy")}>Deploy</button>
        <button onClick={() => changeTab("leaderboard")}>Leaderboard</button>
      </nav>
    </div>
  );
}
