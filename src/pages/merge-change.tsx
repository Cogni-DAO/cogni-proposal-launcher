import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'

interface ProposalParams {
  dao?: string
  plugin?: string  
  signal?: string
  repo?: string
  pr?: string
  reason?: string
  targets?: string
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
        repo: router.query.repo as string,
        pr: router.query.pr as string,
        reason: router.query.reason as string,
        targets: router.query.targets as string,
      })
    }
  }, [router.isReady, router.query])

  const isValidParams = params.dao && params.plugin && params.signal && params.repo && params.pr

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
            <p><strong>Repository:</strong> {params.repo}</p>
            <p><strong>Pull Request:</strong> #{params.pr}</p>
            <p><strong>Reason:</strong> {params.reason}</p>
            <p><strong>Action:</strong> {params.targets}</p>
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
                  <p><strong>Action 1:</strong> Call CogniSignal.emit()</p>
                  <p><strong>Target:</strong> {params.signal}</p>
                  <p><strong>Data:</strong> emitSignal("{params.repo}", {params.pr}, "{params.reason}", "{params.targets}")</p>
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
            <li>plugin - Plugin contract address</li>
            <li>signal - CogniSignal contract address</li>
            <li>repo - Repository name (e.g., "Cogni-DAO/cogni-site")</li>
            <li>pr - Pull request number</li>
          </ul>
          <p><strong>Example URL:</strong></p>
          <code style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', display: 'block', marginTop: '0.5rem' }}>
            /merge-change?dao=0x123...&plugin=0x456...&signal=0x789...&repo=Cogni-DAO%2Fcogni-site&pr=11&reason=checks_failed&targets=merge
          </code>
        </div>
      )}
    </div>
  )
}