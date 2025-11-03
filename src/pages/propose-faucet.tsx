import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useWriteContract, usePublicClient } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { TOKEN_VOTING_ABI } from '../lib/abis'
// Middleware handles validation - page just parses params
import { getChainName } from '../lib/chainUtils'
import NetworkSwitcher from '../components/NetworkSwitcher'
import ProposalActionButton from '../components/ProposalActionButton'


export default function ProposeFaucetPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { writeContract, isPending, isSuccess, error, data } = useWriteContract()
  const client = usePublicClient()
  
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
    // Hard guards - return early if preconditions not met
    if (!params || !client || !address || !isCorrectChain) return

    try {
      // Build single action: Call token.grantMintRole(faucet)
      const actions = [
        {
          to: params.token as `0x${string}`,
          value: 0n,
          data: encodeFunctionData({
            abi: [{ name: 'grantMintRole', type: 'function', inputs: [{ name: 'account', type: 'address' }] }],
            functionName: 'grantMintRole',
            args: [params.faucet as `0x${string}`],
          }),
        },
      ]

      // Use real timestamps to avoid estimator fallback
      const now = Math.floor(Date.now() / 1000)
      const startDate = BigInt(now + 60)          // starts in 1 min
      const endDate   = BigInt(now + 3 * 24 * 3600) // ends in ~3 days

      // Estimate and cap gas when calling createProposal
      const est = await client.estimateContractGas({
        address: params.plugin as `0x${string}`,
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: ['0x', actions, 0n, startDate, endDate, 0, false],
        account: address as `0x${string}`, // Critical to avoid null-sender simulation
      })
      const gas = est * 13n / 10n                // +30%
      const gasLimit = gas > 900_000n ? 900_000n : gas

      await writeContract({
        address: params.plugin as `0x${string}`,
        abi: TOKEN_VOTING_ABI,
        functionName: 'createProposal',
        args: ['0x', actions, 0n, startDate, endDate, 0, false],
        gas: gasLimit,
        account: address as `0x${string}`,
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
                <h3 style={{ marginTop: 0 }}>Proposal Action</h3>
                <p><strong>This proposal will call token.grantMintRole(faucet) to allow the faucet to mint governance tokens.</strong></p>
                <p style={{ fontSize: '14px', color: '#666', marginTop: '1rem' }}>
                  After approval, users will be able to claim tokens from the faucet.
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