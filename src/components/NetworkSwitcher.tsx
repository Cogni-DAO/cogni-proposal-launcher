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
      <div className="bg-background border-2 border-yellow-500 rounded-lg p-4 mb-6">
        <p className="text-foreground font-semibold mb-2">⚠️ Wrong Network</p>
        <p className="text-muted-foreground mb-4">
          You&apos;re connected to {getChainNameById(currentChainId)} but this requires {getChainName(requiredChainId.toString())}.
        </p>
        <button 
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium px-4 py-2 rounded-md transition-colors"
          onClick={() => switchChain?.({ chainId: requiredChainId })}
        >
          Switch to {getChainName(requiredChainId.toString())}
        </button>
      </div>
    )
  }

  return (
    <p className="text-green-400 mb-6 font-medium">
      ✅ Connected to {getChainName(requiredChainId.toString())}
    </p>
  )
}