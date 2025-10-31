import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { TOKEN_VOTING_ABI } from '../lib/abis'
import { validate } from '../lib/deeplink'
import { proposeFaucetSpec } from '../lib/deeplinkSpecs'
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'

// Permission IDs - these match the contract constants
const MINT_PERMISSION_ID = '0x154c00819833dac601ee5ddded6fda79d9d8b506b911b3dbd54cdb95fe6c3686' // keccak256("MINT_PERMISSION")
const CONFIG_PERMISSION_ID = '0x4daa3c18dd72efc111b071bb0b0721e0eb60b1b2ab6e61f2ba6c7adc82cf90a0' // keccak256("CONFIG_PERMISSION")  
const PAUSE_PERMISSION_ID = '0xe1493260c16eb51bf0e670b4b66b3e5ba8b0fa495b2f17b5d7a8bdcfb84b9fb8' // keccak256("PAUSE_PERMISSION")

// PermissionManager.grant selector
const PERMISSION_MANAGER_GRANT_SELECTOR = '0x0b18ff66' // grant(address,address,bytes32)

export default function ProposeFaucetPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  
  const params = useMemo(() => (
    router.isReady ? validate(router.query, proposeFaucetSpec) : null
  ), [router.isReady, router.query])

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

  const getErrorMessage = (error: any) => {
    if (error?.message?.includes('User rejected')) {
      return 'Transaction was cancelled by user'
    }
    if (error?.message?.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    return error?.message || 'Unknown error occurred'
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
            <div>
              {!isSuccess ? (
                <div style={{ backgroundColor: '#e8f4fd', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
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
              ) : null}

              <div style={{ marginBottom: '2rem' }}>
                <button
                  style={{
                    backgroundColor: isCorrectChain ? '#007bff' : '#ccc',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '16px',
                    borderRadius: '6px',
                    cursor: isCorrectChain ? 'pointer' : 'not-allowed',
                    opacity: isPending ? 0.7 : 1
                  }}
                  onClick={createProposal}
                  disabled={isPending || !isCorrectChain}
                >
                  {isPending ? 'Creating Proposal...' : 'Create Faucet Proposal'}
                </button>
                {!isCorrectChain && (
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '0.5rem' }}>
                    Switch to {getChainName(params.chainId)} to enable proposal creation
                  </p>
                )}

                {isSuccess && data && (
                  <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #c3e6cb' }}>
                    <p style={{ margin: 0, color: '#155724' }}>
                      <strong>✅ Proposal Created Successfully!</strong><br />
                      Transaction Hash: <code>{data}</code>
                    </p>
                    <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                      View on <a 
                        href={`https://app.aragon.org/dao/ethereum-sepolia/${params.dao}/proposals`}
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
          
          {error && (
            <div style={{ backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #f5c6cb' }}>
              <p style={{ margin: 0, color: '#721c24' }}>
                <strong>❌ Proposal Creation Failed</strong><br />
                {getErrorMessage(error)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', borderRadius: '8px' }}>
          <h3>Invalid or Missing Parameters</h3>
          <p>This page requires the following URL parameters:</p>
          <ul>
            <li>dao - DAO contract address</li>
            <li>plugin - TokenVoting plugin address</li>
            <li>token - GovernanceERC20 token address</li>
            <li>faucet - FaucetMinter contract address</li>
            <li>chainId - Network chain ID (e.g., 11155111 for Sepolia)</li>
          </ul>
          <p><strong>Example URL:</strong></p>
          <code style={{ backgroundColor: '#f5f5f5', padding: '0.5rem', display: 'block', marginTop: '0.5rem' }}>
            /propose-faucet?dao=0x123...&plugin=0x456...&token=0x789...&faucet=0xabc...&chainId=11155111
          </code>
        </div>
      )}
    </div>
  )
}