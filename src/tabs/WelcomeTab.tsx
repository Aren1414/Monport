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
const IMAGE_PREVIEW_URL =
  'https://mhz5j3u6p57zkqjpwsz5kixyp37p7vkwqoetwxbtzgjof6fyysgq.arweave.net/YfPU7p5_f5VBL7Sz1SL4fv7_1VaDiTtcM8mS4vi4xI0'
const MINI_APP_URL = 'https://monport-three.vercel.app/?tab=welcome'

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
      alert('❌ Please connect your wallet and switch to the Monad Testnet.')
      return
    }

    try {
      setIsMinting(true)
      const totalPriceMon = (NFT_PRICE * selectedAmount).toFixed(2)
      const totalPrice = parseEther(totalPriceMon)

      const confirmMint = window.confirm(
        `🪙 You are about to mint ${selectedAmount} NFT(s) for ${totalPriceMon} MON. Do you want to proceed?`
      )
      if (!confirmMint) {
        setIsMinting(false)
        return
      }

      await writeContract(walletClient, {
        address: WELCOME_CONTRACT_ADDRESS,
        abi: welcomeAbi,
        functionName: 'mint',
        args: [selectedAmount],
        value: totalPrice,
      })

      alert(`🎉 Success! Your NFT has been minted.`)
    } catch (error) {
      console.error('Mint error:', error)
      alert('❌ Mint failed. Please check your wallet balance or network status.')
    } finally {
      setIsMinting(false)
    }
  }

  const shareToWarpcast = () => {
    const shareUrl = `https://warpcast.com/~/compose?text=Check%20out%20this%20Mini%20App!&embeds[]=${encodeURIComponent(
      MINI_APP_URL
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
        {isMinting ? '⏳ Minting...' : `Mint (${selectedAmount})`}
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
