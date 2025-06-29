'use client'

import React, { useEffect } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, optimism, mainnet, degen, unichain, celo } from 'wagmi/chains'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'
import { coinbaseWallet, metaMask, injected } from 'wagmi/connectors'
import { useConnect, useAccount } from 'wagmi'
import { APP_NAME, APP_ICON_URL, APP_URL } from '~/lib/constants'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/** ✅ Monad Testnet definition */
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: '$MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
}

/** ✅ wagmi config */
export const config = createConfig({
  chains: [mainnet, optimism, base, degen, unichain, celo, monadTestnet],
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [degen.id]: http(),
    [unichain.id]: http(),
    [celo.id]: http(),
    [monadTestnet.id]: http(),
  },
  connectors: [
    injected(), 
    miniAppConnector(),
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_ICON_URL,
      preference: 'all',
    }),
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        url: APP_URL,
      },
    }),
  ],
})

const queryClient = new QueryClient()

/** ✅ Combined hook for MetaMask + Coinbase */
function useAutoConnect() {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (typeof window === 'undefined' || isConnected) return

    const ethereum = window.ethereum
    if (!ethereum) return

    const isMetaMask = ethereum.isMetaMask
    const isCoinbase =
      ethereum.isCoinbaseWallet || ethereum.isCoinbaseWalletBrowser

    const connector = isMetaMask
      ? connectors.find(c => c.id === 'metaMask')
      : isCoinbase
      ? connectors.find(c => c.id === 'coinbaseWallet')
      : undefined

    if (connector) {
      connect({ connector })
    }
  }, [connect, connectors, isConnected])
}

/** ✅ Hook-aware wrapper */
function WalletAutoConnect({ children }: { children: React.ReactNode }) {
  useAutoConnect()
  return <>{children}</>
}

/** ✅ Final exported Provider component */
export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletAutoConnect>{children}</WalletAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
