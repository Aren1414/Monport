import { providers } from "ethers";
import { RPC_URL } from "~/lib/constants";

export const getKuruProvider = () => {
  return new providers.JsonRpcProvider(RPC_URL);
};
