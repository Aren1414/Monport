import { ethers } from "ethers";

export type EthereumWindow = typeof window & {
  ethereum?: ethers.providers.ExternalProvider;
};
