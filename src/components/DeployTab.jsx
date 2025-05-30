import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { NFTStorage, File } from "nft.storage";
import monportAbi from "../abis/MonPortFactory.json";
import { MONPORT_FACTORY_ADDRESS } from "../utils/contracts";

const NFT_STORAGE_TOKEN = process.env.NFT_STORAGE_API;

const DeployTab = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
    }
  };

  const handleDeploy = async () => {
    if (!file || !name || !price) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const nftStorage = new NFTStorage({ token: NFT_STORAGE_TOKEN });
      const metadata = await nftStorage.store({
        name,
        description: `${name} on Monad`,
        image: new File([file], file.name, { type: file.type }),
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(MONPORT_FACTORY_ADDRESS, monportAbi, signer);

      const value = ethers.utils.parseUnits("0.5", 18);
      const tx = await contract.deployCustomNFT(metadata.url, name, ethers.utils.parseUnits(price, 18), {
        value,
      });

      await tx.wait();
      alert("Deployment successful!");
    } catch (error) {
      console.error(error);
      alert("Deployment failed.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  return (
    <div className="tab deploy-tab">
      <h2>Create Your NFT Collection</h2>
      {walletAddress && <p>Connected: {walletAddress}</p>}
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <input type="text" placeholder="NFT Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Mint Price in MON" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button onClick={handleDeploy}>Deploy Collection (0.5 MON)</button>
    </div>
  );
};

export default DeployTab;
