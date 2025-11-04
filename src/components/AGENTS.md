# Components Directory

## Purpose

Reusable React components that handle common UI patterns across proposal creation pages.

## Current Components

### `NetworkSwitcher.tsx`
**Usage:** All pages that require specific network connections  
**Props:** `isConnected`, `currentChainId`, `requiredChainId`, `isCorrectChain`  
**Functionality:** Detects network mismatches and provides switching UI with chain names  
**Styling:** Dark theme with black background, yellow warning borders, Tailwind classes  
**Integration:** Consumes `getChainName()` utility for human-readable network labels

### `ProposalMetadata.tsx`
**Usage:** All pages that create Aragon proposals with custom metadata  
**Core Function:** `createProposalMetadata(input: ProposalMetadataInput): Promise<ProposalMetadataResult>`  
**Input Interface:**
```typescript
{
  title: string        // Short proposal identifier
  summary: string      // One-line description  
  description: string  // Detailed content (often just PR URL)
  resources?: Array<{name: string, url: string}>
}
```

**Output:** 
```typescript
{
  metadataBytes: string  // Hex-encoded IPFS URI for Aragon
  title: string         // Echo of input title
  summary: string       // Echo of input summary
}
```

**IPFS Integration:**
- Calls `/api/ipfs` endpoint with metadata JSON
- Handles upload failures gracefully (returns `'0x'` for metadataBytes)
- Implements Aragon UI workaround: puts title + summary + description all in the `description` field

**UI Component:** `ProposalPreview({ title, summary })`  
- Dark secondary background with consistent theme colors  
- Uses Tailwind classes instead of inline styles from cogni-site design system
- Explains that content will appear in description field due to Aragon UI limitations

### `ProposalActionButton.tsx`
**Usage:** Pages that create Aragon proposals (`merge-change`, `propose-faucet`)  
**Props:** Transaction state, chain validation, custom content, button text, DAO address  
**States:** 
- Pre-submission: Shows custom preview content and action button
- Pending: Disabled button with loading text
- Success: Replaces with success message and Aragon App link
- Error: Shows formatted error messages with retry capability

**Error Handling:**
- User rejection: "Transaction was cancelled by user"
- Insufficient funds: "Insufficient funds for transaction" 
- Generic errors: Displays raw error message

**Aragon Integration:** 
- Links to `app.aragon.org/dao/ethereum-sepolia/{daoAddress}/proposals`
- Currently hardcoded to Sepolia network

## Design System Integration

**UI Components:** New `ui/` directory contains reusable components copied from cogni-site:
- `Button`, `Card`, `Alert` components with dark theme styling
- Consistent spacing, typography, and color variables

**Styling Approach:** 
- Tailwind CSS classes replace inline styles
- Dark theme as default with CSS variable integration  
- Responsive design patterns from cogni-site