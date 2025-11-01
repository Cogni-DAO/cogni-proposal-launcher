# API Routes Directory

## Purpose

**TEMPORARY** serverless endpoints that enable the MVP goal of custom proposal titles in Aragon App. Minimal, stateless, deterministic.

## Current Endpoints

### `/api/meta` - Proposal Metadata Endpoint
**Purpose:** Generate JSON metadata for Aragon proposals with custom titles  
**Method:** GET  
**URL Pattern:** `/api/meta?repo=org/repo&pr=11&action=merge&target=change&v=1`  

**Parameters:**
- `repo` - Repository identifier (org/repo format)  
- `pr` - Pull request number (integer)
- `action` - Action type (merge, grant, revoke, etc.)
- `target` - Target type (change, permission, etc.)  
- `v` - API version (default: 1)
- `repoUrl` - Alternative to repo (full URL, URL-encoded)

**Response Format:**
```json
{
  "title": "repo-merge-PR#11",
  "summary": "Merge PR #11 in repo", 
  "description": "This proposal will signal to merge pull request #11 in repository org/repo",
  "version": "1.0.0",
  "type": "proposal",
  "created": "2023-01-01T00:00:00.000Z",
  "parameters": {
    "repository": "org/repo",
    "pullRequest": "11", 
    "action": "merge"
  }
}
```

**Headers:**
- `Content-Type: application/json`
- `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=600`
- `X-Metadata-Version: 1`
- `Access-Control-Allow-Origin: *`

**Validation:**
- Reject if required params (`pr`, `action`) missing
- Cap parameter sizes (repo: 100 chars, pr: 10 digits, action: 20 chars)
- Return 400 with error details for invalid requests

## Integration

**Client Usage:**
```typescript
// Generate metadata URL
const metadataUrl = `https://propose.cognidao.org/api/meta?repo=${encodeURIComponent(repo)}&pr=${pr}&action=${action}&target=${target}&v=1`

// Encode as bytes for Aragon proposal
const metadataBytes = `0x${Buffer.from(metadataUrl).toString('hex')}`

// Use in createProposal
await createProposal(metadataBytes, actions, ...)
```

**Aragon App Behavior:**
- Aragon App reads `_metadata` as URI
- Fetches JSON from the URL
- Displays `title` field in proposal list
- Shows `summary` and `description` in proposal details

## Implementation Constraints

**No Shared Logic:**
- Keep all helpers local to `src/pages/api/meta.ts`
- No imports from `src/lib/` to avoid coupling
- Self-contained parameter parsing and validation

**Size Limits:**
- Endpoint code <50 LOC
- No secrets, environment variables, or external services
- Deterministic output (same params = same JSON)

**Error Handling:**
- Invalid/missing params → 400 with plain text error
- Malformed requests → 400 with validation details
- No 500 errors (all inputs validated upfront)

## Migration Plan

**Phase 1 (Current):** HTTPS metadata endpoint
- Deploy `/api/meta` endpoint in this repo
- Update proposal creation to use HTTPS URLs
- Verify custom titles appear in Aragon App

**Phase 2 (Future):** IPFS migration
- Create separate upload worker/route for IPFS
- Mirror same JSON structure to IPFS
- Switch `_metadata` from HTTPS to `ipfs://<cid>`
- Keep endpoint for backwards compatibility

**Phase 3 (Optional):** Extract to packages
- Move to `packages/metadata` if needed by multiple apps
- Keep endpoint as thin wrapper around shared logic

## Acceptance Criteria

**Functional:**
- ✅ Aragon App shows custom proposal titles
- ✅ Endpoint returns deterministic JSON
- ✅ Cache headers optimize performance
- ✅ CORS enables cross-origin access

**Quality:**
- ✅ <50 LOC implementation
- ✅ No secrets or environment dependencies
- ✅ TypeScript types and validation
- ✅ Snapshot test for JSON structure
- ✅ Lint and type checks pass

## Security & Performance

**Input Validation:**
- Parameter size limits prevent DoS
- Required field validation prevents malformed JSON
- URL encoding/decoding handled safely

**Caching Strategy:**  
- 5-minute cache reduces repeated requests
- Stale-while-revalidate enables fast responses
- Public cache allows CDN optimization

**No State:**
- Stateless, deterministic function
- No database, files, or persistent storage
- Safe to deploy and scale horizontally