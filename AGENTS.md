# Cogni Proposal Launcher

## Purpose

**cogni-git-review** failures will create deeplinks directed to this app. Deep links launch Aragon OSx governance proposals with prefilled actions[] for CogniSignal contracts. Small, auditable, fast.

## Scope (MVP)

**Primary Route:** `/merge-change` - Handle merge/PR approval requests

**Future Routes (V2):**
- `/grant` - Collaborator access grants
- `/revoke` - Collaborator access revocation

**Inputs (URL params):**
- `dao`, `plugin`, `signal`, `repo`, `pr`, `reason`, `targets`

**Flow:** 
Connect wallet → render summary → encode actions[] → createProposal(...) → show proposalId + tx.

**Primary action:** 
Call `CogniSignal.emit(...)` with PR context.

**Outputs:** 
Proposal link (Aragon app), proposalId, tx hash, link back to PR.

## Architecture Overview

**Trigger Source:** 
- **cogni-git-review** (https://github.com/Cogni-DAO/cogni-git-review)
  - Monitors GitHub Pull Requests
  - Generates deep links on merge failures/permission issues
  - Links to `/merge-change` route in this app

**Smart Contracts:**
- **cogni-signal-evm-contracts** (https://github.com/Cogni-DAO/cogni-signal-evm-contracts)  
  - Deploys the DAO + CogniSignal + CogniAction contracts
  - Target for governance proposals created by this launcher

**Backend Consumer:**
- **cogni-git-admin** (https://github.com/Cogni-DAO/cogni-git-admin)
  - Consumes on-chain signals from passed proposals
  - Executes actual Git operations (merge, permissions, etc.)

**Related:**
- **cogni-site** (https://github.com/Cogni-DAO/cogni-site) - Main site with nav/footer links

## Interfaces

**Aragon OSx plugin:** `createProposal(metadata, actions[], allowFailureMap)`

**DAO action:** `{ to, value, data }`

**Signal ABI:** `emitSignal(repo, pr, reason, targets, extra?)` (pin exact ABI from deployed version)

## Security

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