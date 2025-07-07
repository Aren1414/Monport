import { useEffect, useState } from "react";
import { TOKENS } from "@/lib/constants";
import { utils as ethersUtils } from "ethers";

type MarketItem = {
  basetoken?: { address: string; imageurl: string };
  quotetoken?: { address: string; imageurl: string };
};

export function useTokenLogos() {
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchLogos() {
      const pairs = Object.values(TOKENS).map((base) => ({
        baseToken: base,
        quoteToken: TOKENS.USDT,
      }));

      try {
        const res = await fetch("https://api.testnet.kuru.io/api/v1/markets/filtered", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pairs }),
        });

        const json = await res.json();

        const result: Record<string, string> = {};
        (json.data as MarketItem[]).forEach((item) => {
          if (item.basetoken?.address && item.basetoken?.imageurl) {
            result[ethersUtils.getAddress(item.basetoken.address)] = item.basetoken.imageurl;
          }
          if (item.quotetoken?.address && item.quotetoken?.imageurl) {
            result[ethersUtils.getAddress(item.quotetoken.address)] = item.quotetoken.imageurl;
          }
        });

        setLogos(result);
      } catch (err) {
        console.error("❌ Failed to fetch token logos:", err);
      }
    }

    fetchLogos();
  }, []);

  return logos;
}
