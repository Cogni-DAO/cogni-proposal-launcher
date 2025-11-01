# Cogni Proposal Launcher

## Purpose

**cogni-git-review** failures will create deeplinks directed to this app. Deep links launch Aragon OSx governance proposals with prefilled actions[] for CogniSignal contracts. Small, auditable, fast.

## Scope (MVP)

**Primary Route:** `/merge-change` - Handle merge/PR approval requests

**Secondary Routes:** 
- `/join` - Token faucet for DAO membership
- `/propose-faucet` - Create proposal to enable faucet permissions

**Future Routes (V2):**
- `/grant` - Collaborator access grants
- `/revoke` - Collaborator access revocation

**Inputs (URL params):**

**/merge-change:**
- `dao`, `plugin`, `signal`, `repo`, `pr`, `reason`, `targets`

**/join:**
- `chainId`, `faucet`, `token`, `amount`, `decimals`

**/propose-faucet:**
- `dao`, `plugin`, `token`, `faucet`, `chainId`

**Flow:**

**/merge-change:**
Connect wallet → render summary → encode actions[] → createProposal(...) → show proposalId + tx.

**/join:**
Connect wallet → check eligibility → claim tokens → show success status.

**/propose-faucet:**
Connect wallet → show permission summary → create proposal → grant mint/config/pause permissions.

**Validation:**

Server-side middleware validates deep link parameters before page load. Invalid parameters return `400 Bad Request` with error details.

**Actions:**

**/merge-change:** Call `CogniSignal.emit(...)` with PR context.

**/join:** Call `FaucetMinter.claim()` for governance tokens.

**/propose-faucet:** Call `PermissionManager.grant()` three times to enable faucet permissions.

**Outputs:**

**/merge-change:** Proposal link (Aragon app), proposalId, tx hash, link back to PR.

**/join:** Success message, claimed token amount, transaction hash.

**/propose-faucet:** Proposal link (Aragon app), proposalId, tx hash for permission grants.

## Demo Links

**Token Faucet (Sepolia):**
```
https://proposal.cognidao.org/join?chainId=11155111&faucet=0xFACADE0000000000000000000000000000000000&token=0xFDb18054A225E0Ca74BdD8d11BF35633e7893Fc0&amount=1&decimals=18
```

**Merge Change (Sepolia):**
```
https://proposal.cognidao.org/merge-change?dao=0xF480b40bF6d6C8765AA51b7C913cecF23c79E5C6&plugin=0xDD5bB976336145E8372C10CEbf2955c878a32308&signal=0x804CB616EAddD7B6956E67B1D8b2987207160dF7&chainId=11155111&repoUrl=https%3A//github.com/Cogni-DAO/preview-test-repo&pr=56&action=merge&target=change
```

**Propose Faucet (Sepolia):**
```
https://proposal.cognidao.org/propose-faucet?dao=0xF480b40bF6d6C8765AA51b7C913cecF23c79E5C6&plugin=0xDD5bB976336145E8372C10CEbf2955c878a32308&token=0xFDb18054A225E0Ca74BdD8d11BF35633e7893Fc0&faucet=0x3963A719e61BCF8E76fC0A92Cc7635A2134A0592&chainId=11155111
```


## Architecture Overview

**Request Flow:**
Deep link → Middleware validation → Page render → Wallet connect → Transaction

**Core Libraries:**
- `src/lib/deeplink.ts` - Generic parameter validation with typed specs
- `src/lib/deeplinkSpecs.ts` - Route-specific validation rules  
- `src/lib/chainUtils.ts` - Chain name resolution utilities
- `src/components/NetworkSwitcher.tsx` - Reusable network switching UI
- `src/middleware.ts` - Server-side parameter validation (returns 400 for invalid links)

**External Integration:**
- **cogni-git-review** - Generates deep links on PR failures
- **cogni-signal-evm-contracts** - DAO and signal contract deployments  
- **cogni-git-admin** - Consumes on-chain signals to execute Git operations
- **cogni-site** - Main site navigation

## Interfaces

**Validation Types:**
- `"addr"` - 40-character hex address (`/^0x[0-9a-fA-F]{40}$/`)
- `"int"` - Integer string (`/^\d+$/`) 
- `"dec"` - Decimal string (`/^\d+(\.\d+)?$/`)
- `"str"` - Any string

**Route Specs:**
- `joinSpec`: `{ chainId: "int", faucet: "addr", token: "addr", amount: "dec", decimals: "int" }`
- `mergeSpec`: `{ dao: "addr", plugin: "addr", signal: "addr", chainId: "int", repoUrl: "str", pr: "int", action: "str", target: "str" }`
- `proposeFaucetSpec`: `{ dao: "addr", plugin: "addr", token: "addr", faucet: "addr", chainId: "int" }`

**Contract Interfaces:**
- **Aragon OSx plugin:** `createProposal(metadata, actions[], allowFailureMap)`
- **DAO action:** `{ to, value, data }`
- **Signal ABI:** `emitSignal(repo, pr, reason, targets, extra?)` 
- **Faucet ABI:** `claim()`, `hasClaimed(address)`, `remainingTokens()`

## Security

**Parameter Validation:**
- Server-side validation via middleware prevents invalid requests
- Type-safe validation specs enforce address format, numeric values
- Client-side validation provides user feedback for corrections

**Contract Safety:**
- Require `code.length > 0` for dao, plugin, signal before enabling submit  
- Hard-reject unknown chainId. Pin ABIs to deployed versions
- No private keys. User signs with wallet

## Configuration

**Environment variables:**
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_RPC_URL`

**Optional env (or URL):**
- Default DAO, PLUGIN, SIGNAL

**Address sources:** 
Pinned constants or per-link params from cogni-git-review.

## CI/CD

**Development:**
- Lint, typecheck, build on PR
- Preview deploy

**Tests:**
- ABI checksum
- Route param validation
- Calldata encode snapshot

**Release:**
- Tag → prod deploy
- Record contract addresses in a JSON manifest

## Telemetry

**Record:**
- chainId, proposalId, txHash
- SHA256 of encoded actions

**Optional:**
- Webhook to cogni-git-admin for cross-linking PR ↔ proposal

## Roadmap (evolution)

- `/proposals/:id` - read-only viewer (status, quorum, decoded actions)
- `/manage` - gated ops for stewards  
- `/presets` - off-chain JSON "templates" → resolved to actions[]

**Extract shared web3 code to core packages repo later:**
- `packages/web3` (wagmi/viem/RainbowKit, chains, ABIs)
- `packages/ui` (shared components)
- `packages/config` (Zod env)

## Axioms

- Keep proposal assembly off-chain; only submit finalized actions[]
- One deep link per failure type. No hidden side effects
- Exact ABI and chain versioning are non-negotiable
- Small surface area beats feature breadth
- This repo stays public and app-only; shared logic moves to a core packages repo when needed
