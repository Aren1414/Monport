"use client";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { sdk, type FrameContext } from "@farcaster/frame-sdk";
import { getAddressBalance } from "~/utils/monad";
import {
  fetchAccountTxCount,
  fetchAccountTokens,
  fetchAccountActivity,
} from "~/utils/monadExplorer";
import Image from "next/image";

export default function ProfileTab(): JSX.Element {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<string>("0.0000");
  const [username, setUsername] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("/default-avatar.png");
  const [txCount, setTxCount] = useState<number>(0);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [activeDays, setActiveDays] = useState<number>(0);
  const [volumeMon, setVolumeMon] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!isConnected || !address) return;
      // Farcaster profile
      const ctx: FrameContext = await sdk.context;
      const u = ctx.user;
      if (u) {
        setUsername(u.username ?? address.substring(0, 6));
        setAvatar(u.pfpUrl ?? "/default-avatar.png");
      }

      // Balance MON
      const b = await getAddressBalance(address);
      setBalance(b);

      // Tx count and token count
      const tx = await fetchAccountTxCount(address);
      setTxCount(tx);
      const tokens = await fetchAccountTokens(address);
      setTokenCount(tokens.length);

      // Activity data
      const activity = await fetchAccountActivity(address);
      setActiveDays(activity.daysActive);
      setVolumeMon(activity.totalVolume);
    };

    load();
  }, [isConnected, address]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <Image
          src={avatar}
          width={64} 
          height={64} 
          className="rounded-full"
          alt="avatar"
        />
        <div>
          <div className="text-lg font-bold">{username}</div>
          <div className="text-sm text-gray-500">{address}</div>
        </div>
      </div>
      <div>
        <strong>Balance:</strong> {balance} MON
      </div>
      <div>
        <strong>Transactions:</strong> {txCount}
      </div>
      <div>
        <strong>Token Count:</strong> {tokenCount}
      </div>
      <div>
        <strong>Active Days:</strong> {activeDays}
      </div>
      <div>
        <strong>Volume:</strong> {volumeMon.toFixed(2)} MON
      </div>
    </div>
  );
}
