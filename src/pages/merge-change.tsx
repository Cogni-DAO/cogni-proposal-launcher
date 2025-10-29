import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi'

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
  const [params, setParams] = useState<ProposalParams>({})

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

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Create Merge Proposal</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <ConnectButton />
      </div>

      {isValidParams ? (
        <div>
          <h2>Proposal Summary</h2>
          <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <p><strong>Repository:</strong> {params.repoUrl}</p>
            <p><strong>Pull Request:</strong> #{params.pr}</p>
            <p><strong>Action:</strong> {params.action}</p>
            <p><strong>Target:</strong> {params.target}</p>
            <p><strong>Chain ID:</strong> {params.chainId}</p>
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
                    <li>vcs: "github"</li>
                    <li>repoUrl: "{params.repoUrl}"</li>
                    <li>action: "{params.action}"</li>
                    <li>target: "{params.target}"</li>
                    <li>resource: "{params.pr}"</li>
                    <li>extra: 0x</li>
                  </ul>
                </div>
                
                <button 
                  style={{
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  onClick={() => alert('TODO: Implement createProposal transaction')}
                >
                  Create Proposal
                </button>
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
            <li>action - Action to take (e.g., "merge")</li>
            <li>target - Target type (e.g., "change")</li>
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