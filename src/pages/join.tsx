import { useRouter } from 'next/router'
import { useMemo, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, useReadContract } from 'wagmi'
import { FAUCET_ABI } from '../lib/abis'
import { validate } from '../lib/deeplink'
import { joinSpec } from '../lib/deeplinkSpecs'
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'
import { Button } from '../components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'



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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Join the DAO</h1>
          <p className="text-lg text-muted-foreground">Claim your governance tokens to participate in DAO decisions.</p>
        </div>
        
        <div className="mb-8 flex justify-center">
          <ConnectButton />
        </div>

        {params ? (
          <div className="space-y-6">
            <NetworkSwitcher
              isConnected={isConnected}
              currentChainId={chainId}
              requiredChainId={requiredChainId}
              isCorrectChain={isCorrectChain}
            />

            <Card>
              <CardHeader>
                <CardTitle>Token Claim Details</CardTitle>
                <CardDescription>Review the details of your token claim below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">{formatTokenAmount(params.amount, params.decimals)} tokens</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Network</p>
                    <p className="text-lg font-semibold">{getChainName(params.chainId)} (Chain ID: {params.chainId})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Token Contract</p>
                    <p className="text-sm font-mono break-all">{params.token}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Faucet Contract</p>
                    <p className="text-sm font-mono break-all">{params.faucet}</p>
                  </div>
                  {remainingTokens !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Remaining in Faucet</p>
                      <p className="text-lg font-semibold">{remainingTokens.toString()} tokens</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isConnected && isCorrectChain && (
              <div>
                {hasClaimed ? (
                  <Alert variant="destructive">
                    <AlertTitle>Already Claimed</AlertTitle>
                    <AlertDescription>
                      You have already claimed your tokens from this faucet.
                    </AlertDescription>
                  </Alert>
                ) : isSuccess ? (
                  <Alert variant="success">
                    <AlertTitle>Claim Successful!</AlertTitle>
                    <AlertDescription>
                      You have successfully claimed {formatTokenAmount(params.amount, params.decimals)} tokens.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex justify-center">
                    <Button 
                      onClick={executeClaim}
                      disabled={isPending}
                      size="lg"
                      className="w-full md:w-auto"
                    >
                      {isPending ? 'Claiming...' : `Claim ${formatTokenAmount(params.amount, params.decimals)} Tokens`}
                    </Button>
                  </div>
                )}
              </div>
            )}
          
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Claim Failed</AlertTitle>
                <AlertDescription>
                  {getErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}
            
            {!isConnected && (
              <div className="text-center text-muted-foreground">
                <p>Please connect your wallet to continue</p>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Invalid or Missing Parameters</CardTitle>
              <CardDescription>This page requires valid URL parameters to function</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This page requires the following URL parameters:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>chainId - Network chain ID (e.g., 11155111 for Sepolia)</li>
                <li>faucet - FaucetMinter contract address</li>
                <li>token - GovernanceERC20 token address</li>
                <li>amount - Tokens per claim (display value)</li>
                <li>decimals - Token decimals for display</li>
              </ul>
              <div>
                <p className="font-medium mb-2">Example URL:</p>
                <code className="bg-muted p-2 rounded text-xs block overflow-x-auto">
                  /join?chainId=11155111&faucet=0x123...&token=0x456...&amount=1&decimals=18
                </code>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}