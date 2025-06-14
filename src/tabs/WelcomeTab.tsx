"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import welcomeAbi from "~/abis/WelcomeNFT.json";

const WELCOME_CONTRACT_ADDRESS = "0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE";
const NFT_PRICE = 0.3;
const VIDEO_URL =
  "https://zxmqva22v53mlvaeypxc7nyw7ucxf5dat53l2ngf2umq6kiftn3a.arweave.net/zdkKg1qvdsXUBMPuL7cW_QVy9GCfdr00xdUZDykFm3Y";

const MONAD_TESTNET_CHAIN_ID = 10143;

export default function WelcomeTab(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();

  const [selectedAmount, setSelectedAmount] = useState<number>(1);
  const [isMinting, setIsMinting] = useState<boolean>(false);

  useEffect(() => {
    if (isConnected && chain?.id !== MONAD_TESTNET_CHAIN_ID && switchNetworkAsync) {
      switchNetworkAsync(MONAD_TESTNET_CHAIN_ID);
    }
  }, [isConnected, chain, switchNetworkAsync]);

  const mintNFT = async (): Promise<void> => {
    if (!address || chain?.id !== MONAD_TESTNET_CHAIN_ID) {
      alert("Please connect wallet and switch to Monad Testnet.");
      return;
    }

    try {
      setIsMinting(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(WELCOME_CONTRACT_ADDRESS, welcomeAbi, signer);
      const totalPrice = parseUnits((NFT_PRICE * selectedAmount).toString(), 18);
      const tx = await contract.mint(selectedAmount, { value: totalPrice });
      await tx.wait();
      alert("Mint successful.");
    } catch (error) {
      console.error(error);
      alert("Mint failed.");
    } finally {
      setIsMinting(false);
    }
  };

  const shareToWarpcast = (): void => {
    const shareUrl = `https://warpcast.com/~/compose?text=I%20just%20minted%20a%20Welcome%20NFT%20on%20Monad%20via%20@overo.eth!&embeds[]=${encodeURIComponent(
      VIDEO_URL
    )}`;
    window.open(shareUrl, "_blank");
  };

  const followOvero = (): void => {
    window.open("https://warpcast.com/overo.eth", "_blank");
  };

  return (
    <div className="tab welcome-tab">
      <h2>Welcome to MonPort</h2>
      <p>🎉 Mint your commemorative NFT celebrating Monad & Farcaster</p>

      <video
        width="100%"
        controls
        autoPlay
        loop
        muted
        style={{ borderRadius: 12 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      <div
        className="mint-options"
        style={{ margin: "16px 0", display: "flex", gap: 8 }}
      >
        {[1, 5, 10].map((amt) => (
          <button
            key={amt}
            onClick={() => setSelectedAmount(amt)}
            style={{
              background: selectedAmount === amt ? "#4caf50" : "#eee",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
            type="button"
          >
            {amt}
          </button>
        ))}
      </div>

      <button
        onClick={mintNFT}
        disabled={isMinting}
        style={{
          width: "100%",
          padding: "12px",
          background: "#28a745",
          color: "white",
          fontWeight: "bold",
          border: "none",
          borderRadius: 8,
          cursor: isMinting ? "not-allowed" : "pointer",
        }}
        type="button"
      >
        {isMinting ? "Minting..." : `Mint (${selectedAmount})`}
      </button>

      <button
        onClick={shareToWarpcast}
        style={{
          width: "100%",
          padding: "12px",
          background: "#1d9bf0",
          color: "white",
          marginTop: 12,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
        type="button"
      >
        Share to Warpcast
      </button>

      <button
        onClick={followOvero}
        style={{
          width: "100%",
          padding: "12px",
          background: "#845ef7",
          color: "white",
          marginTop: 12,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
        type="button"
      >
        Follow @overo.eth (+200 points)
      </button>

      <div style={{ marginTop: 20, fontSize: 14 }}>
        <h4>Earn Points:</h4>
        <ul style={{ paddingLeft: 20 }}>
          <li>+50 points per minted Welcome NFT</li>
          <li>+200 points for following @overo.eth</li>
          <li>+30 points per successful referral (first-time mint only)</li>
        </ul>
      </div>
    </div>
  );
}
