# Pages Directory

## Purpose

Next.js pages that handle validated deep links and convert them into blockchain transactions.

## Current Routes

### `/join.tsx` - Token Faucet Route
**Triggered by:** Direct deep links for DAO membership  
**URL Params:** `chainId`, `faucet`, `token`, `amount`, `decimals`  
**Flow:** Parameter validation → Connect wallet → Network switching → Token claiming → Success status
**Components:** Uses `NetworkSwitcher` and `ui/Card`, `ui/Button`, `ui/Alert` from cogni-site design system  
**Styling:** Modern card-based layout with dark theme, responsive design  
**Contract:** Calls `FaucetMinter.claim()` after eligibility check

### `/merge-change.tsx` - Primary MVP Route  
**Triggered by:** cogni-git-review when PR merge fails due to permissions/checks  
**URL Params:** `dao`, `plugin`, `signal`, `chainId`, `repoUrl`, `pr`, `action`, `target`  
**Flow:** Parameter validation → Connect wallet → Network switching → Show proposal summary → Create proposal → Emit CogniSignal
**Components:** Uses `NetworkSwitcher`, `ProposalActionButton`, `ProposalMetadata`, and `ui/Card`, `ui/Alert` from cogni-site design system  
**Styling:** Card-based layout with dark theme, responsive grid for contract addresses

**Metadata Generation:**
- `generateProposalTitle()`: Creates format `{repoName}-{action}-PR#{pr}`
- `generateProposalSummary()`: Creates format `{Action} PR #{pr} in {repoName}`  
- `getPrUrl()`: Constructs GitHub PR URL `{repoUrl}/pull/{pr}`
- URL helpers: `getDecodedRepoUrl()`, `getRepoName()` to avoid repeated decoding

**IPFS Integration:**
- Uses `createProposalMetadata()` from ProposalMetadata component
- Title and summary go to IPFS, description contains just the PR URL
- Metadata gets uploaded to IPFS, returns hex-encoded URI for Aragon proposal

### `/propose-faucet.tsx` - Faucet Permission Route
**Triggered by:** Direct deep links to enable faucet functionality  
**URL Params:** `dao`, `plugin`, `token`, `faucet`, `chainId`  
**Flow:** Parameter validation → Connect wallet → Network switching → Show permission summary → Create proposal → Grant faucet permissions
**Components:** Uses `NetworkSwitcher` and `ProposalActionButton` for consistent proposal creation UX
**Contract:** Creates single-action proposal calling `token.grantMintRole(faucet)` to enable faucet minting
**Validation:** Guards against missing address, client, or wrong chain before contract calls
**Gas Management:** Estimates gas with 30% padding, caps at 900k to prevent failures

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

**Proposal Creation Utilities:**
- `validateContractCall()` - Guards against missing address, client, or wrong chain before contract calls
- `generateProposalTimestamps()` - Creates proper start/end dates (now+60s to now+3days) to prevent estimation failures
- `estimateProposalGas()` - Estimates gas with 30% safety buffer, capped at 900k for transaction reliability

**Contract Call Pattern:**
Both proposal routes (`merge-change`, `propose-faucet`) follow consistent pattern:
1. Validate preconditions with `validateContractCall()`
2. Build action array specific to route (signal emission or token role grant)  
3. Generate proper timestamps with `generateProposalTimestamps()`
4. Estimate gas safely with `estimateProposalGas()`
5. Execute `writeContract()` with estimated gas and account parameter
