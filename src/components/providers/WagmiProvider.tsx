'use client'

import React, { useEffect, useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, optimism, mainnet, degen, unichain, celo } from 'wagmi/chains'
import { farcasterFrame } from '@farcaster/frame-wagmi-connector'
import { metaMask, coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { APP_NAME, APP_ICON_URL, APP_URL } from '~/lib/constants'
import { useConnect, useAccount } from 'wagmi'

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
    farcasterFrame(),
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

/** 🔁 Auto-connect for Coinbase Wallet */
function useCoinbaseAutoConnect() {
  const [enabled, setEnabled] = useState(false)
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    const isCB =
      window?.ethereum?.isCoinbaseWallet ||
      window?.ethereum?.isCoinbaseWalletBrowser
    setEnabled(!!isCB)
  }, [])

  useEffect(() => {
    if (enabled && !isConnected) {
      const cb = connectors.find(c => c.id === 'coinbaseWallet')
      cb && connect({ connector: cb })
    }
  }, [enabled, isConnected, connect, connectors])
}

/** 🔁 Auto-connect for MetaMask */
function useMetaMaskAutoConnect() {
  const [enabled, setEnabled] = useState(false)
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()

  useEffect(() => {
    const isMM = window?.ethereum?.isMetaMask
    setEnabled(!!isMM)
  }, [])

  useEffect(() => {
    if (enabled && !isConnected) {
      const mm = connectors.find(c => c.id === 'metaMask')
      mm && connect({ connector: mm })
    }
  }, [enabled, isConnected, connect, connectors])
}

/** 🧠 Wrapper that triggers both auto-connects */
function WalletAutoConnect({ children }: { children: React.ReactNode }) {
  void useCoinbaseAutoConnect()
  void useMetaMaskAutoConnect()
  return <>{children}</>
}

/** ✅ Main wagmi provider */
export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletAutoConnect>{children}</WalletAutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
