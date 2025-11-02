import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { TOKEN_VOTING_ABI } from '../lib/abis'
// Middleware handles validation - page just parses params
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'
import ProposalActionButton from '../components/ProposalActionButton'

// Permission IDs - these match the deployed contract constants
// To verify/update: Use `cast call <CONTRACT_ADDRESS> "PERMISSION_NAME_ID()"` on deployed contracts
// Example: cast call --rpc-url <RPC_URL> 0xTokenAddress "MINT_PERMISSION_ID()"
const MINT_PERMISSION_ID = '0xb737b436e6cc542520cb79ec04245c720c38eebfa56d9e2d99b043979db20e4c' // keccak256("MINT_PERMISSION")
const CONFIG_PERMISSION_ID = '0x49e4aa25ce7d4eb5f024f9f6ebef20f963732b9e73790c8b2f196e01e90e8eb2' // keccak256("CONFIG_PERMISSION")  
const PAUSE_PERMISSION_ID = '0x595f29b9b81abb2cfafd1caa277c849a6317ded4aa7672cd5e076bacaf78ba3e' // keccak256("PAUSE_PERMISSION")

export default function ProposeFaucetPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  
  // Middleware is single source of truth - just parse, don't validate
  const one = (v: any) => Array.isArray(v) ? v[0] : v ?? ""
  const params = useMemo(() => router.isReady ? {
    dao: one(router.query.dao),
    plugin: one(router.query.plugin), 
    token: one(router.query.token),
    faucet: one(router.query.faucet),
    chainId: one(router.query.chainId),
  } : null, [router.isReady, router.query])

  const requiredChainId = params ? parseInt(params.chainId) : 0
  const isCorrectChain = chainId === requiredChainId

  const createProposal = async () => {
    if (!params) return

    try {
      // Build the three permission grant actions
      const actions = [
        // Action 1: Grant MINT_PERMISSION to faucet (on token contract)
        {
          to: params.dao as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: [{ 
              name: 'grant',
              type: 'function',
              inputs: [
                { name: 'where', type: 'address' },
                { name: 'who', type: 'address' },
                { name: 'permissionId', type: 'bytes32' }
              ]
            }],
            functionName: 'grant',
            args: [params.token, params.faucet, MINT_PERMISSION_ID]
          })
        },
        // Action 2: Grant CONFIG_PERMISSION to DAO (on faucet contract)  
        {
          to: params.dao as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: [{ 
              name: 'grant',
              type: 'function',
              inputs: [
                { name: 'where', type: 'address' },
                { name: 'who', type: 'address' },
                { name: 'permissionId', type: 'bytes32' }
              ]
            }],
            functionName: 'grant',
            args: [params.faucet, params.dao, CONFIG_PERMISSION_ID]
          })
        },
        // Action 3: Grant PAUSE_PERMISSION to DAO (on faucet contract)
        {
          to: params.dao as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: [{ 
              name: 'grant',
              type: 'function',
              inputs: [
                { name: 'where', type: 'address' },
                { name: 'who', type: 'address' },
                { name: 'permissionId', type: 'bytes32' }
              ]
            }],
            functionName: 'grant',
            args: [params.faucet, params.dao, PAUSE_PERMISSION_ID]
          })
        }
      ]

      // Create proposal using TokenVoting plugin
      await writeContract({
        address: params.plugin as `0x${string}`,
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: [
          '0x',        // metadata (empty like merge-change)
          actions,     // actions[]
          BigInt(0),   // allowFailureMap
          BigInt(0),   // startDate (immediate)
          BigInt(0),   // endDate (plugin default)
          0,           // VoteOption.None
          false        // tryEarlyExecution
        ],
      })

    } catch (err) {
      console.error('Proposal creation failed:', err)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Enable Token Faucet</h1>
      <p>Create a DAO proposal to enable the token faucet for new members.</p>

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
            <p><strong>Token Contract:</strong> {params.token}</p>
            <p><strong>Faucet Contract:</strong> {params.faucet}</p>
            <p><strong>Network:</strong> {getChainName(params.chainId)} (Chain ID: {params.chainId})</p>
            <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p><strong>DAO:</strong> {params.dao}</p>
            <p><strong>Plugin:</strong> {params.plugin}</p>
          </div>

          {isConnected ? (
            <ProposalActionButton
              onAction={createProposal}
              isPending={isPending}
              isSuccess={isSuccess}
              data={data}
              error={error}
              isCorrectChain={isCorrectChain}
              chainId={params.chainId}
              buttonText="Create Faucet Proposal"
              pendingText="Creating Proposal..."
              daoAddress={params.dao}
            >
              <div style={{ backgroundColor: '#e8f4fd', padding: '1.5rem', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>Proposal Actions</h3>
                <p><strong>This proposal will execute 3 permission grants:</strong></p>
                <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  <li><strong>MINT_PERMISSION:</strong> Allow faucet to mint governance tokens</li>
                  <li><strong>CONFIG_PERMISSION:</strong> Allow DAO to configure faucet settings</li> 
                  <li><strong>PAUSE_PERMISSION:</strong> Allow DAO to pause/unpause the faucet</li>
                </ol>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '1rem' }}>
                  After approval, the faucet will be fully operational for token claims.
                </p>
              </div>
            </ProposalActionButton>
          ) : (
            <p style={{ color: '#666' }}>Please connect your wallet to continue</p>
          )}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}