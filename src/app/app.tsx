"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const WelcomeTab = dynamic(() => import("~/tabs/WelcomeTab"), { ssr: false });
const SwapTab = dynamic(() => import("~/tabs/SwapTab"), { ssr: false });
const DeployTab = dynamic(() => import("~/tabs/DeployTab"), { ssr: false });
const LeaderboardTab = dynamic(() => import("~/tabs/LeaderboardTab"), { ssr: false });

export default function App() {
  const [activeTab, setActiveTab] = useState("welcome");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setActiveTab("swap")}>Swap</button>
        <button
          onClick={() => setActiveTab("welcome")}
          style={{ fontWeight: "bold", borderBottom: "2px solid #2266ee" }}
        >
          Welcome
        </button>
        <button onClick={() => setActiveTab("deploy")}>Deploy</button>
        <button onClick={() => setActiveTab("leaderboard")}>Leaderboard</button>
      </div>

      {activeTab === "welcome" && <WelcomeTab />}
      {activeTab === "swap" && <SwapTab />}
      {activeTab === "deploy" && <DeployTab />}
      {activeTab === "leaderboard" && <LeaderboardTab />}
    </div>
  );
}
