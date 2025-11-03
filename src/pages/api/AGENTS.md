# API Routes Directory

## Purpose

Serverless endpoints that enable IPFS metadata upload for Aragon proposals. Minimal, stateless, deterministic.

## Current Implementation

### `/api/ipfs` - IPFS Metadata Upload
**Purpose:** Upload proposal metadata JSON to IPFS via Pinata and return CID  
**Method:** POST  
**Content-Type:** `application/json`

**Request Body:**
```typescript
interface MetadataUploadBody {
  title: string        // Required
  summary: string      // Required  
  description: string  // Optional
  resources?: any[]    // Optional
}
```

**Response Format:**
```json
{
  "cid": "QmHash...",
  "ipfsUri": "ipfs://QmHash...",
  "size": 1024,
  "gateway": "https://gateway.pinata.cloud/ipfs/QmHash..."
}
```

**Validation:**
- Requires `title` and `summary` fields
- JSON size limit: 10KB maximum
- Returns 400 for missing fields or oversized payload
- Returns 500 if `PINATA_API_JWT` environment variable not configured

**Integration:**
- Called by `createProposalMetadata()` function in `/src/components/ProposalMetadata.tsx`
- Returns CID which gets encoded as `stringToHex('ipfs://' + cid)` for Aragon proposals
- Fallback: Returns `metadataBytes: '0x'` if upload fails

**Headers:**
- CORS enabled: `Access-Control-Allow-Origin: *`
- Accepts: `Content-Type: application/json`

## Aragon Metadata Schema Discovery

### The Core Issue
**Problem:** Only the `description` field displays in Aragon UI. `title` and `summary` fields are ignored.

**Investigation Results:**
- Found OSx script: `osx/packages/contracts/scripts/management-dao-proposal/generate-managing-dao-proposal-info.ts`
- Official format: `{title, summary, description, resources}`
- Reality: Aragon App UI only renders `description` field content

**Current Workaround:**
```typescript
const officialMetadata = {
  title: "repo-merge-PR#123",           // Ignored by UI
  summary: "Merge PR #123 in repo",    // Ignored by UI  
  description: `repo-merge-PR#123

Merge PR #123 in repo

https://github.com/owner/repo/pull/123`, // Only field that displays
  resources: []
}
```

## IPFS Provider Analysis

### Current: Pinata Implementation
**API Used:** `pinJSONToIPFS` (legacy proprietary endpoint)  
**Why:** Simple JSON upload, returns CID immediately  
**Authentication:** Bearer token via `PINATA_API_JWT` environment variable

### Future Migration Path to Self-Hosted
**Problem:** Pinata uses proprietary APIs, not standard Kubo HTTP API  

**Recommendation from Investigation:**
> "Neither Pinata 'v3 scopes' nor the 'legacy' endpoints are Kubo's API. Kubo = /api/v0/add (multipart), open-source node."

**Migration Strategy:**
1. **Implement provider adapter** - abstract IPFS upload behind single interface
2. **For Pinata:** Continue using `pinFileToIPFS` with multipart 
3. **For self-hosted:** Switch to Kubo's `/api/v0/add` with same multipart structure
4. **Benefit:** Same CIDs, same contracts, just swap base URL

**Current Implementation Portability:**
- ✅ CIDs are provider-agnostic 
- ✅ Low vendor lock-in
- ⚠️ API format differs between providers
- 📋 TODO: Add thin adapter layer for easier migration

## Security Considerations

### Current Implementation: Host Header Authentication
**Protection:** Host header validation prevents unauthorized access
**Mechanism:** 
```javascript
const host = req.headers.host
const allowed = [process.env.APP_HOST, `www.${process.env.APP_HOST}`]
if (!allowed.includes(host)) return res.status(403).json({ error: 'forbidden' })
```

**Access Control:**
- **Development:** `APP_HOST=localhost:3000` allows local development
- **Production:** `APP_HOST=proposal.cognidao.org` allows both apex and www subdomain
- **Cross-origin:** Blocked by absence of CORS headers
- **Environment Variables:** Only `APP_HOST` and `PINATA_API_JWT` required

## Performance & Reliability

**Current Approach:**
- Direct Pinata upload from serverless function
- No retry logic or failover
- 10KB size limit prevents DoS
- CORS headers allow browser usage

**Determinism:**
- Same JSON input → Same CID output
- Proposal metadata is reproducible
- Can log `sha256(JSON)` and CID for audit trails

**Cost Model:**
- Pinata: Pay per pin + bandwidth
- Self-hosted: Infrastructure + bandwidth
- Current usage: Low volume, meets uptime needs

## Error Handling

**Upload Failures:**
- Pinata API error → Return `{ metadataBytes: '0x' }`
- Client handles gracefully → Proposal shows generic "TOKENVOTING-XX" title
- User gets warning but transaction continues

**Validation Failures:**
- Missing title/summary → 400 error with details
- Oversized payload → 400 error with size limit
- Invalid JSON → 500 error with details