export async function getAddressBalance(address: string): Promise<string> {
  const res = await fetch("https://testnet-rpc.monad.xyz/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 }),
  });
  const { result } = await res.json();
  const ethVal = Number(BigInt(result)) / 1e18;
  return ethVal.toFixed(4);
}
