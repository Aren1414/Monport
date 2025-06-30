import { providers } from "ethers";
import { KURU_RPC_URL } from "~/lib/constants";

export const getKuruProvider = () => {
  return new providers.JsonRpcProvider(KURU_RPC_URL);
};
