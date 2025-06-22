"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { APP_NAME } from "~/lib/constants";

const WelcomeTab = dynamic(() => import("~/tabs/WelcomeTab"), { ssr: false });
const ProfileTab = dynamic(() => import("~/tabs/ProfileTab"), { ssr: false });
const SwapTab = dynamic(() => import("~/tabs/SwapTab"), { ssr: false });
const DeployTab = dynamic(() => import("~/tabs/DeployTab"), { ssr: false });
const LeaderboardTab = dynamic(() => import("~/tabs/LeaderboardTab"), { ssr: false });

export default function App({ title }: { title?: string } = { title: APP_NAME }) {
  const [activeTab, setActiveTab] = useState("welcome");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("profile")}>👤 Profile</button>
        <button onClick={() => setActiveTab("swap")}>🔄 Swap</button>
        <button
          onClick={() => setActiveTab("welcome")}
          style={{ fontWeight: "bold", borderBottom: "2px solid #2266ee" }}
        >
          🏠 Welcome
        </button>
        <button onClick={() => setActiveTab("deploy")}>🚀 Deploy</button>
        <button onClick={() => setActiveTab("leaderboard")}>🏆 Leaderboard</button>
      </div>

      {activeTab === "welcome" && <WelcomeTab />}
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "swap" && <SwapTab />}
      {activeTab === "deploy" && <DeployTab />}
      {activeTab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}
