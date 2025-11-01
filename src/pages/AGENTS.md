# Pages Directory

## Purpose

Next.js pages that handle validated deep links and convert them into blockchain transactions.

## Current Routes

### `/join.tsx` - Token Faucet Route
**Triggered by:** Direct deep links for DAO membership  
**URL Params:** `chainId`, `faucet`, `token`, `amount`, `decimals`  
**Flow:** Parameter validation → Connect wallet → Network switching → Token claiming → Success status
**Components:** Uses `NetworkSwitcher` for chain validation and switching
**Contract:** Calls `FaucetMinter.claim()` after eligibility check

### `/merge-change.tsx` - Primary MVP Route  
**Triggered by:** cogni-git-review when PR merge fails due to permissions/checks  
**URL Params:** `dao`, `plugin`, `signal`, `chainId`, `repoUrl`, `pr`, `action`, `target`  
**Flow:** Parameter validation → Connect wallet → Network switching → Show proposal summary → Create proposal → Emit CogniSignal
**Components:** Uses `NetworkSwitcher` and `ProposalActionButton` for consistent proposal creation UX

### `/propose-faucet.tsx` - Faucet Permission Route
**Triggered by:** Direct deep links to enable faucet functionality  
**URL Params:** `dao`, `plugin`, `token`, `faucet`, `chainId`  
**Flow:** Parameter validation → Connect wallet → Network switching → Show permission summary → Create proposal → Grant faucet permissions
**Components:** Uses `NetworkSwitcher` and `ProposalActionButton` for consistent proposal creation UX
**Contract:** Creates proposal with 3 permission grants:
- MINT_PERMISSION: `grant(token, faucet, 0x154c0081...)` - Allows faucet to mint tokens
- CONFIG_PERMISSION: `grant(faucet, dao, 0x4daa3c18...)` - Allows DAO to configure faucet  
- PAUSE_PERMISSION: `grant(faucet, dao, 0xe1493260...)` - Allows DAO to pause faucet

## Shared Architecture

**Validation System:**
- Server-side: `src/middleware.ts` is single source of truth - returns 400 for invalid deep links
- Client-side: Pages trust middleware and parse `router.query` without re-validating
- Type specs: `joinSpec`, `mergeSpec`, and `proposeFaucetSpec` from `src/lib/deeplinkSpecs.ts`
- Loading state: Pages show "Loading..." until `router.isReady` to avoid hydration issues

**Common Components:**
- `NetworkSwitcher` - Handles wrong network detection and switching
- `ProposalActionButton` - Standardized proposal creation workflow with success/error states
- `ConnectButton` from RainbowKit - Wallet connection interface

**Data Flow:**
Deep link → Middleware validation → Page render → Parameter validation → Wallet connect → Network check → Transaction

**Error Handling:**
- Invalid URLs: 400 response with plain text error
- Missing params: Error UI with parameter requirements
- Wrong network: Network switching prompt with chain names
- Transaction errors: Formatted error messages with retry options
