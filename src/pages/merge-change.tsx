import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { COGNI_SIGNAL_ABI, TOKEN_VOTING_ABI } from '../lib/abis'

interface ProposalParams {
  dao?: string
  plugin?: string  
  signal?: string
  chainId?: string
  repoUrl?: string
  pr?: string
  action?: string
  target?: string
}


export default function MergeChangePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  const [params, setParams] = useState<ProposalParams>({})

  const getChainName = (chainId: string) => {
    switch (chainId) {
      case '1': return 'Ethereum Mainnet'
      case '11155111': return 'Sepolia Testnet'
      case '137': return 'Polygon'
      case '8453': return 'Base'
      default: return `Chain ${chainId}`
    }
  }

  const getChainNameById = (id: number) => {
    return getChainName(id.toString())
  }

  const requiredChainId = parseInt(params.chainId || '0')
  const isCorrectChain = chainId === requiredChainId

  useEffect(() => {
    if (router.isReady) {
      setParams({
        dao: router.query.dao as string,
        plugin: router.query.plugin as string,
        signal: router.query.signal as string,
        chainId: router.query.chainId as string,
        repoUrl: router.query.repoUrl as string,
        pr: router.query.pr as string,
        action: router.query.action as string,
        target: router.query.target as string,
      })
    }
  }, [router.isReady, router.query])

  const isValidParams = params.dao && params.plugin && params.signal && params.chainId && params.repoUrl && params.pr && params.action && params.target

  const createProposal = async () => {
    if (!isValidParams || !params.signal || !params.plugin) return

    try {
      // Step 1: Encode the CogniSignal.signal() call
      const signalCallData = encodeFunctionData({
        abi: COGNI_SIGNAL_ABI,
        functionName: 'signal',
        args: [
          'github',                    // vcs
          decodeURIComponent(params.repoUrl!), // repoUrl (decode URL encoding)
          params.action!,              // action
          params.target!,              // target
          params.pr!,                  // resource (PR number)
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
          '0x',      // _metadata (empty)
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

      {isValidParams ? (
        <div>
          {isConnected && !isCorrectChain && params.chainId ? (
            <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeaa7' }}>
              <p><strong>⚠️ Wrong Network</strong></p>
              <p>You&apos;re connected to {getChainNameById(chainId)} but this proposal requires {getChainName(params.chainId)}.</p>
              <button 
                style={{
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
                onClick={() => switchChain?.({ chainId: requiredChainId })}
              >
                Switch to {getChainName(params.chainId)}
              </button>
            </div>
          ) : isConnected ? (
            <p style={{ color: '#28a745', marginBottom: '2rem' }}>✅ Connected to {getChainName(params.chainId || '')}</p>
          ) : null}

          <h2>Proposal Summary</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <p><strong>Repository:</strong> {params.repoUrl ? decodeURIComponent(params.repoUrl) : ''}</p>
            <p><strong>Pull Request:</strong> #{params.pr}</p>
            <p><strong>Action:</strong> {params.action}</p>
            <p><strong>Target:</strong> {params.target}</p>
            <p><strong>Network:</strong> {getChainName(params.chainId || '')} (Chain ID: {params.chainId})</p>
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p><strong>DAO:</strong> {params.dao}</p>
            <p><strong>Plugin:</strong> {params.plugin}</p>
            <p><strong>Signal Contract:</strong> {params.signal}</p>
          </div>

          {isConnected ? (
            <div>
              <h3>Connected as: {address}</h3>
              <div style={{ marginTop: '2rem' }}>
                <h3>Proposal Actions</h3>
                <div style={{ backgroundColor: '#e8f4fd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p><strong>Action 1:</strong> Call CogniSignal.signal()</p>
                  <p><strong>Target:</strong> {params.signal}</p>
                  <p><strong>Parameters:</strong></p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>vcs: &quot;github&quot;</li>
                    <li>repoUrl: &quot;{params.repoUrl ? decodeURIComponent(params.repoUrl) : ''}&quot;</li>
                    <li>action: &quot;{params.action}&quot;</li>
                    <li>target: &quot;{params.target}&quot;</li>
                    <li>resource: &quot;{params.pr}&quot;</li>
                    <li>extra: 0x</li>
                  </ul>
                </div>
                
                <button 
                  style={{
                    backgroundColor: isCorrectChain && !isPending ? '#0070f3' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: isCorrectChain && !isPending ? 'pointer' : 'not-allowed',
                    fontSize: '16px'
                  }}
                  disabled={!isCorrectChain || isPending}
                  onClick={createProposal}
                >
                  {isPending ? 'Creating Proposal...' : 'Create Proposal'}
                </button>
                {!isCorrectChain && (
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '0.5rem' }}>
                    Switch to {getChainName(params.chainId || '')} to enable proposal creation
                  </p>
                )}

                {error && (
                  <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #f5c6cb' }}>
                    <p><strong>❌ Transaction Failed</strong></p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>{error.message}</p>
                  </div>
                )}

                {isSuccess && data && (
                  <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #c3e6cb' }}>
                    <p><strong>✅ Proposal Created Successfully!</strong></p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                      Transaction Hash: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{data}</code>
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                      View on <a 
                        href={`https://app.aragon.org/dao/${params.chainId === '11155111' ? 'ethereum-sepolia' : 'ethereum'}/${params.dao}/proposals`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#007bff', textDecoration: 'underline' }}
                      >
                        Aragon App
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>Please connect your wallet to continue</p>
          )}
        </div>
      ) : (
        <div style={{ color: '#red' }}>
          <h2>Missing Required Parameters</h2>
          <p>This page requires the following URL parameters:</p>
          <ul>
            <li>dao - DAO contract address</li>
            <li>plugin - Aragon voting plugin contract address</li>
            <li>signal - CogniSignal contract address</li>
            <li>chainId - Chain ID for validation</li>
            <li>repoUrl - Full GitHub repository URL</li>
            <li>pr - Pull request number</li>
            <li>action - Action to take (e.g., &quot;merge&quot;)</li>
            <li>target - Target type (e.g., &quot;change&quot;)</li>
          </ul>
          <p><strong>Example URL:</strong></p>
          <code style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', display: 'block', marginTop: '0.5rem' }}>
            /merge-change?dao=0x123...&plugin=0x456...&signal=0x789...&chainId=11155111&repoUrl=https%3A//github.com/Cogni-DAO/preview-test-repo&pr=56&action=merge&target=change
          </code>
        </div>
      )}
    </div>
  )
}