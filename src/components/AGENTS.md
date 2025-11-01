# Components Directory

## Purpose

Reusable React components that handle common UI patterns across proposal creation pages.

## Current Components

### `NetworkSwitcher.tsx`
**Usage:** All pages that require specific network connections  
**Props:** `isConnected`, `currentChainId`, `requiredChainId`, `isCorrectChain`  
**Functionality:** Detects network mismatches and provides switching UI with chain names  
**Integration:** Consumes `getChainName()` utility for human-readable network labels

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

## Shared Patterns

**Chain Validation:** Components expect `isCorrectChain` boolean and handle disabled states accordingly  
**Error Display:** Consistent red-background error boxes with formatted messages  
**Success States:** Green-background success boxes with transaction hashes and external links