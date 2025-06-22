const BASE_URL = "https://api.blockvision.org/v2/monad";

export async function fetchAccountTxCount(addr: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/account/transactions?address=${addr}&limit=1`);
  const json = await res.json();
  return json.result?.total ?? 0;
}

export async function fetchAccountTokens(addr: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE_URL}/account/tokens?address=${addr}`);
  const json = await res.json();
  return json.result?.data || [];
}

export async function fetchAccountActivity(addr: string): Promise<{ daysActive: number; totalVolume: number }> {
  const res = await fetch(`${BASE_URL}/account/activity?address=${addr}`);
  const json = await res.json();
  const days = json.result?.meta?.daysActive ?? 0;
  const volWei = BigInt(json.result?.meta?.totalVolume ?? "0");
  return { daysActive: days, totalVolume: Number(volWei) / 1e18 };
}
