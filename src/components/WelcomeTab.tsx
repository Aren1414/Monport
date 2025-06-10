import React, { useState, useEffect } from "react";
import { Contract, BrowserProvider, parseUnits } from "ethers";
import { useAccount, useConnect } from "wagmi";  
import { WELCOME_NFT_ADDRESS, WELCOME_NFT_ABI } from "~/lib/constants"; 
import "../styles/App.css";

const NFT_PRICE = 0.3; // in MON
const VIDEO_URL = "https://zxmqva22v53mlvaeypxc7nyw7ucxf5dat53l2ngf2umq6kiftn3a.arweave.net/zdkKg1qvdsXUBMPuL7cW_QVy9GCfdr00xdUZDykFm3Y";

const WelcomeTab = () => {
  const [selectedAmount, setSelectedAmount] = useState(1);
  const { address, isConnected } = useAccount(); 
  const { connect, connectors } = useConnect(); 

  const mintNFT = async () => {
    if (!isConnected) return alert("Connect wallet first.");
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(WELCOME_NFT_ADDRESS, WELCOME_NFT_ABI, signer);
      const value = parseUnits((NFT_PRICE * selectedAmount).toString(), 18);
      const tx = await contract.mint(selectedAmount, { value });
      await tx.wait();
      alert("Mint successful!");
    } catch (error) {
      console.error(error);
      alert("Mint failed.");
    }
  };

  useEffect(() => {
    if (!isConnected) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connect, connectors]);

  return (
    <div className="tab welcome-tab">
      <h2>Welcome to MonPort</h2>
      <p>Mint your commemorative NFT celebrating Monad & Farcaster</p>

      <video width="100%" controls autoPlay loop muted style={{ borderRadius: "12px" }}>
        <source src={VIDEO_URL} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="mint-options">
        {[1, 5, 10].map((amt) => (
          <button key={amt} onClick={() => setSelectedAmount(amt)} className={selectedAmount === amt ? "active" : ""}>
            {amt}
          </button>
        ))}
      </div>

      <button className="mint-btn" onClick={mintNFT}>Mint ({selectedAmount} NFT)</button>
      <button className="share-btn">Share to Warpcast</button>
      <button className="follow-btn">Follow @overo.eth +200 points</button>

      <div className="points-info">
        <h4>Earn Points:</h4>
        <ul>
          <li>+50 points for each Welcome NFT mint</li>
          <li>+200 points for following @overo.eth</li>
          <li>+30 points per successful referral (first-time mint only)</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeTab;
