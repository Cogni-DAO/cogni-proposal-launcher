import type { PublicClient } from 'viem'

/**
 * Contract interaction utilities for proposal creation
 */

/**
 * Validates preconditions before contract calls to prevent crashes
 */
export function validateContractCall(params: {
  params: unknown
  client: PublicClient | undefined
  address: string | undefined
  isCorrectChain: boolean
}): boolean {
  return !!(params.params && params.client && params.address && params.isCorrectChain)
}

/**
 * Generates proper proposal timestamps (avoids BigInt(0) estimation failures)
 */
export function generateProposalTimestamps(): {
  startDate: bigint
  endDate: bigint
} {
  const now = Math.floor(Date.now() / 1000)
  return {
    startDate: BigInt(now + 60),           // starts in 1 min
    endDate: BigInt(now + 3 * 24 * 3600)  // ends in 3 days
  }
}

/**
 * Estimates gas with safety buffer and cap to prevent failures
 */
export async function estimateProposalGas(
  client: PublicClient,
  params: {
    address: `0x${string}`
    abi: readonly unknown[]
    functionName: string
    args: unknown[]
    account: `0x${string}`
  }
): Promise<bigint> {
  const est = await client.estimateContractGas(params)
  const withBuffer = est * 13n / 10n        // +30% buffer
  return withBuffer > 900_000n ? 900_000n : withBuffer  // cap at 900k
}