declare module "@kuru-labs/kuru-sdk" {
  export namespace TokenSwap {
    function swap(
      signer: any,
      router: string,
      path: any,
      amount: number,
      inputDecimals: number,
      outputDecimals: number,
      approveTokens: boolean,
      callback: (txHash: string | null) => void
    ): Promise<any>;
  }

  export class PoolFetcher {
    constructor(apiUrl: string);
    getAllPools(
      fromToken: string,
      toToken: string,
      baseTokens: { symbol: string; address: string }[]
    ): Promise<any[]>;
  }

  export namespace PathFinder {
    function findBestPath(
      provider: any,
      fromToken: string,
      toToken: string,
      amount: number,
      type: "amountIn" | "amountOut",
      poolFetcher: any,
      pools: any[]
    ): Promise<any>;
  }

  export class ParamCreator {
    calculatePrecisions(
      currentPrice: number,
      baseAmount: number,
      maxPrice: number,
      minOrderSize: number,
      tickSizeBps: number
    ): {
      sizePrecision: number;
      pricePrecision: number;
      tickSize: number;
      minSize: number;
      maxSize: number;
    };

    deployMarket(
      signer: any,
      router: string,
      marketType: number,
      baseToken: string,
      quoteToken: string,
      sizePrecision: number,
      pricePrecision: number,
      tickSize: number,
      minSize: number,
      maxSize: number,
      takerFeeBps: number,
      makerFeeBps: number,
      ammSpreadBps: any
    ): Promise<string>;
  }

  export class MonadDeployer {
    deployTokenAndMarket(
      signer: any,
      monadDeployerAddress: string,
      tokenParams: any,
      marketParams: any
    ): Promise<{ tokenAddress: string; marketAddress: string }>;
  }
}
