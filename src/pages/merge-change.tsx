import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { createProposalMetadata, ProposalPreview } from '../components/ProposalMetadata'
import { COGNI_SIGNAL_ABI, TOKEN_VOTING_ABI } from '../lib/abis'
import { validate } from '../lib/deeplink'
import { mergeSpec } from '../lib/deeplinkSpecs'
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'
import ProposalActionButton from '../components/ProposalActionButton'

export default function MergeChangePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  
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
    if (!params) return

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
          params.action,               // action
          params.target,               // target
          params.pr,                   // resource (PR number)
          '0x'                         // extra (empty bytes)
        ],
      })

      // Step 2: Create the Action structure for Aragon
      const actions = [{
        to: params.signal as `0x${string}`,  // CogniSignal contract address
        value: BigInt(0),                    // No ETH value
        data: signalCallData,                // Encoded function call
      }]

      // Step 3: Create the proposal
      await writeContract({
        address: params.plugin as `0x${string}`,  // Aragon plugin address
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: [
          metadataBytes as `0x${string}`, // _metadata (HTTPS URL or empty)
          actions,   // _actions
          BigInt(0), // _allowFailureMap (no failures allowed)
          BigInt(0), // _startDate (immediate)
          BigInt(0), // _endDate (plugin default)
          0,         // _voteOption (None)
          false      // _tryEarlyExecution
        ],
      })
    } catch (error) {
      console.error('Failed to create proposal:', error)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Merge Proposal</h1>
      
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

          <h2>Proposal Summary</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <p><strong>Repository:</strong> {getDecodedRepoUrl()}</p>
            <p><strong>Pull Request:</strong> #{params.pr}</p>
            <p><strong>Action:</strong> {params.action}</p>
            <p><strong>Target:</strong> {params.target}</p>
            <p><strong>Network:</strong> {getChainName(params.chainId)} (Chain ID: {params.chainId})</p>
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p><strong>DAO:</strong> {params.dao}</p>
            <p><strong>Plugin:</strong> {params.plugin}</p>
            <p><strong>Signal Contract:</strong> {params.signal}</p>
          </div>

          {isConnected ? (
            <div>
              <h3>Connected as: {address}</h3>
              <div style={{ marginTop: '2rem' }}>
                <h3>Proposal Preview</h3>
                <ProposalPreview 
                  title={generateProposalTitle()}
                  summary={generateProposalSummary()}
                />

                <h3>Proposal Actions</h3>
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
                >
                  <div style={{ backgroundColor: '#e8f4fd', padding: '1rem', borderRadius: '8px' }}>
                    <p><strong>Action 1:</strong> Call CogniSignal.signal()</p>
                    <p><strong>Target:</strong> {params.signal}</p>
                    <p><strong>Parameters:</strong></p>
                    <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                      <li>vcs: &quot;github&quot;</li>
                      <li>repoUrl: &quot;{getDecodedRepoUrl()}&quot;</li>
                      <li>action: &quot;{params.action}&quot;</li>
                      <li>target: &quot;{params.target}&quot;</li>
                      <li>resource: &quot;{params.pr}&quot;</li>
                      <li>extra: 0x</li>
                    </ul>
                  </div>
                </ProposalActionButton>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>Please connect your wallet to continue</p>
          )}
        </div>
      ) : (
        <div style={{ color: '#red' }}>
          <h2>Missing Required Parameters</h2>
          <p>This page requires valid URL parameters. Please check the link and try again.</p>
        </div>
      )}
    </div>
  )
}