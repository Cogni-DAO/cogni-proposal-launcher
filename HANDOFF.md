# Custom Proposal Titles Implementation - HANDOFF

## ✅ COMPLETED

### 1. Serverless Metadata Endpoint
- **File**: `/src/pages/api/meta.ts` (47 LOC)
- **URL Pattern**: `/api/meta?repoUrl=...&pr=11&action=merge&target=change&v=1`
- **Response**: JSON with `title`, `summary`, `description` fields
- **Headers**: Cache-Control, CORS, versioning
- **Validation**: Parameter size limits, required field checks

### 2. Integration with Proposal Creation
- **File**: `/src/pages/merge-change.tsx`
- **Logic**: Generates metadata URL, fetches to validate, encodes as bytes
- **Fallback**: Uses `'0x'` if metadata endpoint fails
- **Preview**: Shows proposed title in UI before submission

### 3. Documentation
- **File**: `/src/pages/api/AGENTS.md`
- **Covers**: API spec, validation rules, migration plan, constraints
- **Standards**: <50 LOC, no secrets, deterministic, stateless

## 🎯 EXPECTED BEHAVIOR

**Before (current)**: Proposals show "TOKENVOTING-XX" in Aragon App  
**After (with this)**: Proposals show "test-repo-merge-PR#56" custom titles

**URL Example**:
```
https://proposal.cognidao.org/api/meta?repoUrl=https%3A%2F%2Fgithub.com%2Ftest-org%2Ftest-repo&pr=56&action=merge&target=change&v=1
```

**Response Example**:
```json
{
  "title": "test-repo-merge-PR#56",
  "summary": "Merge PR #56 in test-repo",
  "description": "This proposal will signal to merge pull request #56 in repository https://github.com/test-org/test-repo"
}
```

## 🔄 FLOW

1. User clicks "Create Proposal"
2. App generates: `https://domain.com/api/meta?repoUrl=...&pr=56&action=merge...`
3. App encodes URL as bytes: `0x68747470733a2f2f...`
4. Calls `createProposal(metadataBytes, actions, ...)`
5. Aragon App fetches metadata URL and displays custom title

## ⚠️ NEXT STEPS

### Testing
1. Deploy to test environment
2. Create a proposal with custom metadata
3. Verify title appears correctly in Aragon App
4. Test fallback behavior when endpoint fails

### Production Deploy
1. Update `baseUrl` in production to use actual domain
2. Verify CORS headers work cross-origin
3. Monitor endpoint performance and caching

### Future Migration (when ready)
1. Create IPFS upload route: `/api/upload-meta` 
2. Mirror same JSON structure to IPFS
3. Switch from HTTPS URLs to `ipfs://<cid>`
4. Keep HTTPS endpoint for backwards compatibility

## 📁 FILES MODIFIED

- `/src/pages/api/meta.ts` - New endpoint
- `/src/pages/api/AGENTS.md` - New documentation  
- `/src/pages/merge-change.tsx` - Updated to use metadata endpoint
- Helper functions: `generateProposalTitle()`, `generateProposalSummary()`

## 🚀 READY TO TEST

The implementation is complete and ready for testing. The endpoint follows all specified constraints: <50 LOC, no secrets, deterministic, stateless, with proper validation and caching.