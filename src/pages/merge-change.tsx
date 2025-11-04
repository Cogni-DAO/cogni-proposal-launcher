import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, usePublicClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { createProposalMetadata, ProposalPreview } from '../components/ProposalMetadata'
import { COGNI_SIGNAL_ABI, TOKEN_VOTING_ABI } from '../lib/abis'
import { validateContractCall, generateProposalTimestamps, estimateProposalGas } from '../lib/contractUtils'
import { validate } from '../lib/deeplink'
import { mergeSpec } from '../lib/deeplinkSpecs'
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'
import ProposalActionButton from '../components/ProposalActionButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert'

export default function MergeChangePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  const client = usePublicClient()
  
  const params = useMemo(() => (
    router.isReady ? validate(router.query, mergeSpec) : null
  ), [router.isReady, router.query])

  const requiredChainId = params ? parseInt(params.chainId) : 0
  const isCorrectChain = chainId === requiredChainId

  const getDecodedRepoUrl = () => params ? decodeURIComponent(params.repoUrl) : ''
  const getRepoName = () => getDecodedRepoUrl().split('/').pop() || ''
  const getPrUrl = () => `${getDecodedRepoUrl()}/pull/${params?.pr}`

  const generateProposalTitle = () => {
    if (!params?.repoUrl || !params?.action || !params?.pr) return 'Loading...'
    return `${getRepoName()}-${params.action}-PR#${params.pr}`
  }

  const generateProposalSummary = () => {
    if (!params?.action || !params?.pr || !params?.repoUrl) return ''
    return `${params.action?.charAt(0).toUpperCase()}${params.action?.slice(1)} PR #${params.pr} in ${getRepoName()}`
  }

  const createProposal = async () => {
    // Validate preconditions before contract calls
    if (!validateContractCall({ params, client, address, isCorrectChain })) return

    try {
      // Step 0: Create and upload metadata
      const { metadataBytes } = await createProposalMetadata({
        title: generateProposalTitle(),
        summary: generateProposalSummary(),
        description: getPrUrl()
      })

      // Step 1: Encode the CogniSignal.signal() call
      const signalCallData = encodeFunctionData({
        abi: COGNI_SIGNAL_ABI,
        functionName: 'signal',
        args: [
          'github',                    // vcs
          getDecodedRepoUrl(), // repoUrl (decode URL encoding)
          params!.action,               // action
          params!.target,               // target
          params!.pr,                   // resource (PR number)
          '0x'                         // extra (empty bytes)
        ],
      })

      // Step 2: Create the Action structure for Aragon
      const actions = [{
        to: params!.signal as `0x${string}`,  // CogniSignal contract address
        value: BigInt(0),                    // No ETH value
        data: signalCallData,                // Encoded function call
      }]

      // Generate proper proposal timestamps
      const { startDate, endDate } = generateProposalTimestamps()

      // Estimate gas with safety buffer and cap
      const gasLimit = await estimateProposalGas(client!, {
        address: params!.plugin as `0x${string}`,
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: [metadataBytes as `0x${string}`, actions, 0n, startDate, endDate, 0, false],
        account: address as `0x${string}`,
      })

      // Step 3: Create the proposal
      await writeContract({
        address: params!.plugin as `0x${string}`,  // Aragon plugin address
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: [
          metadataBytes as `0x${string}`, // _metadata (HTTPS URL or empty)
          actions,   // _actions
          0n,        // _allowFailureMap (no failures allowed)
          startDate, // _startDate (proper timestamp)
          endDate,   // _endDate (proper timestamp)
          0,         // _voteOption (None)
          false      // _tryEarlyExecution
        ],
        gas: gasLimit,
        account: address as `0x${string}`,
      })
    } catch (error) {
      console.error('Failed to create proposal:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Create Merge Proposal</h1>
          <p className="text-lg text-muted-foreground">Submit a governance proposal to merge a pull request</p>
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
                <CardTitle>Proposal Summary</CardTitle>
                <CardDescription>Review the pull request and governance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Repository</p>
                    <p className="font-mono text-sm break-all">{getDecodedRepoUrl()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pull Request</p>
                    <p className="text-lg font-semibold">#{params.pr}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Action</p>
                    <p className="text-lg font-semibold capitalize">{params.action}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target</p>
                    <p className="text-lg font-semibold">{params.target}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Network</p>
                    <p className="text-lg font-semibold">{getChainName(params.chainId)} (Chain ID: {params.chainId})</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Contract Addresses</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">DAO</p>
                      <p className="font-mono text-sm break-all">{params.dao}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Plugin</p>
                      <p className="font-mono text-sm break-all">{params.plugin}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Signal Contract</p>
                      <p className="font-mono text-sm break-all">{params.signal}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isConnected ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Connected Wallet</CardTitle>
                    <CardDescription>Currently connected as</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-sm break-all">{address}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Preview</CardTitle>
                    <CardDescription>How this proposal will appear in the DAO</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProposalPreview 
                      title={generateProposalTitle()}
                      summary={generateProposalSummary()}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Actions</CardTitle>
                    <CardDescription>Technical details of what this proposal will execute</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary p-4 rounded-lg mb-6">
                      <p className="font-semibold mb-2">Action 1: Call CogniSignal.signal()</p>
                      <p className="text-sm text-muted-foreground mb-3">Target: {params.signal}</p>
                      <div>
                        <p className="font-medium text-sm mb-2">Parameters:</p>
                        <ul className="space-y-1 text-sm font-mono">
                          <li>• vcs: &quot;github&quot;</li>
                          <li>• repoUrl: &quot;{getDecodedRepoUrl()}&quot;</li>
                          <li>• action: &quot;{params.action}&quot;</li>
                          <li>• target: &quot;{params.target}&quot;</li>
                          <li>• resource: &quot;{params.pr}&quot;</li>
                          <li>• extra: 0x</li>
                        </ul>
                      </div>
                    </div>
                    
                    <ProposalActionButton
                      onAction={createProposal}
                      isPending={isPending}
                      isSuccess={isSuccess}
                      data={data}
                      error={error}
                      isCorrectChain={isCorrectChain}
                      chainId={params.chainId}
                      buttonText="Create Proposal"
                      pendingText="Creating Proposal..."
                      daoAddress={params.dao}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Please connect your wallet to continue</p>
              </div>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Missing Required Parameters</AlertTitle>
            <AlertDescription>
              This page requires valid URL parameters. Please check the link and try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}