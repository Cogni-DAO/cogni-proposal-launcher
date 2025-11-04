# Lib Directory

## Purpose

Core utilities and validation functions shared across proposal creation pages and components.

## Current Utilities

### `contractUtils.ts` - Contract Interaction Patterns
**Usage:** Proposal pages that create Aragon governance proposals
**Functions:**
- `validateContractCall()` - Validates preconditions (params, client, address, chain) before contract calls
- `generateProposalTimestamps()` - Creates proper start/end dates to prevent gas estimation failures  
- `estimateProposalGas()` - Estimates gas with 30% buffer, caps at 900k for transaction reliability

**Pattern:** Used by both `merge-change.tsx` and `propose-faucet.tsx` for consistent error prevention

### `chainUtils.ts` - Network Utilities
**Functions:**
- `getChainName()` - Maps chain IDs to human-readable names
- `getChainNameById()` - Number-based chain ID lookup

### `deeplink.ts` - Parameter Validation  
**Functions:**
- Generic validation with typed specs (addr/int/dec/str patterns)
- Used by middleware for server-side parameter validation

### `deeplinkSpecs.ts` - Route Validation Rules
**Exports:** `joinSpec`, `mergeSpec`, `proposeFaucetSpec` for type-safe parameter validation

### `abis.ts` - Contract Interfaces
**Exports:** `COGNI_SIGNAL_ABI`, `TOKEN_VOTING_ABI`, `FAUCET_ABI` for contract interactions

## Integration Pattern

Utilities follow consistent import/usage pattern:
1. Import specific functions needed by page/component
2. Call validation utilities before contract interactions
3. Use gas estimation utilities for transaction reliability
4. Apply consistent error handling patterns