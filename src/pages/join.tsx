import { useRouter } from 'next/router'
import { useMemo, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi'
import { FAUCET_ABI } from '../lib/abis'
import { validate } from '../lib/deeplink'
import { joinSpec } from '../lib/deeplinkSpecs'
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'



export default function JoinPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error } = useWriteContract()
  
  const params = useMemo(() => (
    router.isReady ? validate(router.query, joinSpec) : null
  ), [router.isReady, router.query])

  const requiredChainId = params ? parseInt(params.chainId) : 0
  const isCorrectChain = chainId === requiredChainId

  // Check if user has already claimed
  const { data: hasClaimed, refetch: refetchClaimStatus } = useReadContract({
    address: params?.faucet as `0x${string}`,
    abi: FAUCET_ABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!(params?.faucet && address && isCorrectChain)
    }
  })

  // Get remaining tokens in faucet
  const { data: remainingTokens } = useReadContract({
    address: params?.faucet as `0x${string}`,
    abi: FAUCET_ABI,
    functionName: 'remainingTokens',
    query: {
      enabled: !!(params?.faucet && isCorrectChain)
    }
  })

  const formatTokenAmount = (amount: string, decimals: string): string => {
    const amountNum = parseFloat(amount)
    const decimalsNum = parseInt(decimals)
    return amountNum.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimalsNum > 6 ? 6 : decimalsNum 
    })
  }

  const executeClaim = async () => {
    if (!params?.faucet || !isCorrectChain) return

    try {
      await writeContract({
        address: params.faucet as `0x${string}`,
        abi: FAUCET_ABI,
        functionName: 'claim',
      })
    } catch (error) {
      console.error('Failed to claim tokens:', error)
    }
  }

  // Handle successful claim to refetch status
  useEffect(() => {
    if (isSuccess) {
      refetchClaimStatus()
    }
  }, [isSuccess, refetchClaimStatus])

  const getErrorMessage = (error: any): string => {
    if (error?.message?.includes('AlreadyClaimed')) {
      return 'You have already claimed your tokens.'
    }
    if (error?.message?.includes('FaucetPaused')) {
      return 'The faucet is temporarily unavailable.'
    }
    if (error?.message?.includes('GlobalCapExceeded')) {
      return 'The faucet has no tokens remaining.'
    }
    if (error?.message?.includes('User rejected')) {
      return 'Transaction was rejected.'
    }
    return 'An error occurred while claiming tokens.'
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Join the DAO</h1>
      <p>Claim your governance tokens to participate in DAO decisions.</p>
      
      <div style={{ marginBottom: '2rem' }}>
        <ConnectButton />
      </div>

      {params ? (
        <div>
          <NetworkSwitcher
            isConnected={isConnected}
            currentChainId={chainId}
            requiredChainId={requiredChainId}
            isCorrectChain={isCorrectChain}
          />

          <div style={{ backgroundColor: '#e8f4fd', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h3 style={{ marginTop: 0 }}>Token Claim Details</h3>
            <p><strong>Amount:</strong> {formatTokenAmount(params.amount, params.decimals)} tokens</p>
            <p><strong>Token Contract:</strong> {params.token}</p>
            <p><strong>Faucet Contract:</strong> {params.faucet}</p>
            <p><strong>Network:</strong> {getChainName(params.chainId)} (Chain ID: {params.chainId})</p>
            {remainingTokens !== undefined && (
              <p><strong>Remaining in Faucet:</strong> {remainingTokens.toString()} tokens</p>
            )}
          </div>

          {isConnected && isCorrectChain && (
            <div>
              {hasClaimed ? (
                <div style={{ backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                  <p style={{ margin: 0, color: '#721c24' }}>
                    <strong>✋ Already Claimed</strong><br />
                    You have already claimed your tokens from this faucet.
                  </p>
                </div>
              ) : isSuccess ? (
                <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                  <p style={{ margin: 0, color: '#155724' }}>
                    <strong>🎉 Claim Successful!</strong><br />
                    You have successfully claimed {formatTokenAmount(params.amount, params.decimals)} tokens.
                  </p>
                </div>
              ) : (
                <div>
                  <button 
                    style={{
                      backgroundColor: isPending ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isPending ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    onClick={executeClaim}
                    disabled={isPending}
                  >
                    {isPending ? 'Claiming...' : `Claim ${formatTokenAmount(params.amount, params.decimals)} Tokens`}
                  </button>
                </div>
              )}
            </div>

          )}
          
          {error && (
            <div style={{ backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #f5c6cb' }}>
              <p style={{ margin: 0, color: '#721c24' }}>
                <strong>❌ Claim Failed</strong><br />
                {getErrorMessage(error)}
              </p>
            </div>
          )}
          
          {!isConnected && (
            <p style={{ color: '#666' }}>Please connect your wallet to continue</p>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
          <h3>Invalid or Missing Parameters</h3>
          <p>This page requires the following URL parameters:</p>
          <ul>
            <li>chainId - Network chain ID (e.g., 11155111 for Sepolia)</li>
            <li>faucet - FaucetMinter contract address</li>
            <li>token - GovernanceERC20 token address</li>
            <li>amount - Tokens per claim (display value)</li>
            <li>decimals - Token decimals for display</li>
          </ul>
          <p><strong>Example URL:</strong></p>
          <code style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', display: 'block', marginTop: '0.5rem' }}>
            /join?chainId=11155111&faucet=0x123...&token=0x456...&amount=1&decimals=18
          </code>
        </div>
      )}
    </div>
  )
}