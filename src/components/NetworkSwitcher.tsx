import { useSwitchChain } from 'wagmi'
import { getChainName, getChainNameById } from '../lib/chainUtils'

interface NetworkSwitcherProps {
  isConnected: boolean
  currentChainId: number
  requiredChainId: number
  isCorrectChain: boolean
}

export default function NetworkSwitcher({ 
  isConnected, 
  currentChainId, 
  requiredChainId, 
  isCorrectChain 
}: NetworkSwitcherProps) {
  const { switchChain } = useSwitchChain()

  if (!isConnected) return null

  if (!isCorrectChain) {
    return (
      <div style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeaa7' }}>
        <p><strong>⚠️ Wrong Network</strong></p>
        <p>You&apos;re connected to {getChainNameById(currentChainId)} but this requires {getChainName(requiredChainId.toString())}.</p>
        <button 
          style={{
            backgroundColor: '#f39c12',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '0.5rem'
          }}
          onClick={() => switchChain?.({ chainId: requiredChainId })}
        >
          Switch to {getChainName(requiredChainId.toString())}
        </button>
      </div>
    )
  }

  return (
    <p style={{ color: '#28a745', marginBottom: '2rem' }}>
      ✅ Connected to {getChainName(requiredChainId.toString())}
    </p>
  )
}