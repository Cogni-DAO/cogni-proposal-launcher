# Pages Directory

## Purpose

Next.js pages that handle deep links from **cogni-git-review** and convert them into Aragon governance proposals.

## Current Routes

### `/merge-change.tsx` - Primary MVP Route
**Triggered by:** cogni-git-review when PR merge fails due to permissions/checks  
**URL Params:** `dao`, `plugin`, `signal`, `repo`, `pr`, `reason`, `targets`  
**Flow:** Extract params → Connect wallet → Show proposal summary → Create proposal → Emit CogniSignal

**Next Steps:**
1. Add contract address validation (`code.length > 0`)
2. Implement `createProposal()` transaction with encoded `CogniSignal.emit()` calldata
3. Add error handling and transaction status
4. Show proposal link and tx hash on success

### Future Routes (V2)
- `/grant.tsx` - Collaborator access grants
- `/revoke.tsx` - Collaborator access revocation  
- `/proposals/[id].tsx` - Read-only proposal viewer

## Technical Requirements

**Security:**
- Validate all contract addresses have bytecode before enabling submit
- Pin ABIs to specific deployed contract versions
- Hard-reject unknown chainIds

**UX:**
- Clear parameter validation errors
- Transaction status feedback
- Links back to original PR and created proposal

**Data Flow:**
URL params → Validate → Connect wallet → Encode actions[] → createProposal() → CogniSignal.emit()

Demo url: http://localhost:3001/merge-change?dao=0x123&plugin=0x456&signal=0x789&repo=Cogni-DAO%2Fcogni-site&pr=11&reason=checks_failed&targets=merge
