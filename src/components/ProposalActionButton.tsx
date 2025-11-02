import type { ReactNode } from 'react'
import { getChainName } from '../lib/chainUtils'

interface ProposalActionButtonProps {
  onAction: () => void
  isPending: boolean
  isSuccess: boolean
  data?: string
  error?: any
  isCorrectChain: boolean
  chainId: string
  buttonText: string
  daoAddress: string
  pendingText: string
  children?: ReactNode // For custom preview content
}

export default function ProposalActionButton({
  onAction,
  isPending,
  isSuccess,
  data,
  error,
  isCorrectChain,
  chainId,
  buttonText,
  daoAddress,
  pendingText,
  children
}: ProposalActionButtonProps) {
  const getErrorMessage = (error: any) => {
    if (error?.message?.includes('User rejected')) {
      return 'Transaction was cancelled by user'
    }
    if (error?.message?.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    return error?.message || 'Unknown error occurred'
  }

  if (isSuccess && data) {
    // Success state - hide button, show success message
    return (
      <div style={{ backgroundColor: '#d4edda', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #c3e6cb' }}>
        <p style={{ margin: 0, color: '#155724' }}>
          <strong>✅ Proposal Created Successfully!</strong><br />
          Transaction Hash: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>{data}</code>
        </p>
        <p style={{ fontSize: '14px', marginTop: '0.5rem' }}>
          View on <a 
            href={`https://app.aragon.org/dao/ethereum-sepolia/${daoAddress}/proposals`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline' }}
          >
            Aragon App
          </a>
        </p>
      </div>
    )
  }

  // Pre-success state - show preview content and button
  return (
    <div>
      {children && (
        <div style={{ marginBottom: '2rem' }}>
          {children}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <button
          style={{
            backgroundColor: isCorrectChain && !isPending ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            fontSize: '16px',
            borderRadius: '6px',
            cursor: isCorrectChain && !isPending ? 'pointer' : 'not-allowed',
            opacity: isPending ? 0.7 : 1
          }}
          onClick={onAction}
          disabled={isPending || !isCorrectChain}
        >
          {isPending ? pendingText : buttonText}
        </button>
        
        {!isCorrectChain && (
          <p style={{ color: '#666', fontSize: '14px', marginTop: '0.5rem' }}>
            Switch to {getChainName(chainId)} to enable proposal creation
          </p>
        )}

        {error && (
          <div style={{ backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid #f5c6cb' }}>
            <p style={{ margin: 0, color: '#721c24' }}>
              <strong>❌ Proposal Creation Failed</strong><br />
              {getErrorMessage(error)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}