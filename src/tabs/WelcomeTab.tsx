'use client'

import React, { useEffect, useState } from 'react'
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { writeContract } from 'viem/actions'
import { parseEther } from 'viem'
import { sdk } from '@farcaster/frame-sdk'
import welcomeAbi from '~/abis/WelcomeNFT.json'

const WELCOME_CONTRACT_ADDRESS = '0x40649af9dEE8bDB94Dc21BA2175AE8f5181f14AE'
const NFT_PRICE = 0.3
const VIDEO_URL =
  'https://zxmqva22v53mlvaeypxc7nyw7ucxf5dat53l2ngf2umq6kiftn3a.arweave.net/zdkKg1qvdsXUBMPuL7cW_QVy9GCfdr00xdUZDykFm3Y'

const MONAD_TESTNET_CHAIN_ID = 10143

export default function WelcomeTab() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()

  const [selectedAmount, setSelectedAmount] = useState(1)
  const [isMinting, setIsMinting] = useState(false)

  useEffect(() => {
    if (isConnected && chainId !== MONAD_TESTNET_CHAIN_ID) {
      switchChain({ chainId: MONAD_TESTNET_CHAIN_ID })
    }
  }, [isConnected, chainId, switchChain])

  useEffect(() => {
    sdk.actions.ready()
  }, [])

  const mintNFT = async () => {
    if (!walletClient || !address || chainId !== MONAD_TESTNET_CHAIN_ID) {
      alert('Please connect wallet and switch to Monad Testnet.')
      return
    }

    try {
      setIsMinting(true)
      const totalPrice = parseEther((NFT_PRICE * selectedAmount).toFixed(2))

      const txHash = await writeContract(walletClient, {
        address: WELCOME_CONTRACT_ADDRESS,
        abi: welcomeAbi,
        functionName: 'mint',
        args: [selectedAmount],
        value: totalPrice,
      })

      alert('Mint submitted! Tx hash: ' + txHash)
    } catch (error) {
      console.error('Mint error:', error)
      alert('Mint failed. See console for details.')
    } finally {
      setIsMinting(false)
    }
  }

  const shareToWarpcast = () => {
    const shareUrl = `https://warpcast.com/~/compose?text=I%20just%20minted%20a%20Welcome%20NFT%20on%20Monad%20via%20@overo.eth!&embeds[]=${encodeURIComponent(
      VIDEO_URL
    )}`
    window.open(shareUrl, '_blank')
  }

  const followOvero = () => {
    window.open('https://warpcast.com/overo.eth', '_blank')
  }

  return (
    <div className="tab welcome-tab">
      <h2>Welcome to MonPort</h2>
      <p>🎉 Mint your commemorative NFT celebrating Monad & Farcaster</p>

      <video
        width="100%"
        controls
        autoPlay
        loop
        muted
        style={{ borderRadius: 12 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      <div
        className="mint-options"
        style={{ margin: '16px 0', display: 'flex', gap: 8 }}
      >
        {[1, 5, 10].map((amt) => (
          <button
            key={amt}
            onClick={() => setSelectedAmount(amt)}
            style={{
              background: selectedAmount === amt ? '#4caf50' : '#eee',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            type="button"
          >
            {amt}
          </button>
        ))}
      </div>

      <button
        onClick={mintNFT}
        disabled={isMinting}
        style={{
          width: '100%',
          padding: '12px',
          background: '#28a745',
          color: 'white',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: 8,
          cursor: isMinting ? 'not-allowed' : 'pointer',
        }}
        type="button"
      >
        {isMinting ? 'Minting...' : `Mint (${selectedAmount})`}
      </button>

      <button
        onClick={shareToWarpcast}
        style={{
          width: '100%',
          padding: '12px',
          background: '#1d9bf0',
          color: 'white',
          marginTop: 12,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
        type="button"
      >
        Share to Warpcast
      </button>

      <button
        onClick={followOvero}
        style={{
          width: '100%',
          padding: '12px',
          background: '#845ef7',
          color: 'white',
          marginTop: 12,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
        type="button"
      >
        Follow @overo.eth (+200 points)
      </button>

      <div style={{ marginTop: 20, fontSize: 14 }}>
        <h4>Earn Points:</h4>
        <ul style={{ paddingLeft: 20 }}>
          <li>+50 points per minted Welcome NFT</li>
          <li>+200 points for following @overo.eth</li>
          <li>+30 points per successful referral (first-time mint only)</li>
        </ul>
      </div>
    </div>
  )
}
