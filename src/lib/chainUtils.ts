// Shared chain utilities

export const getChainName = (chainId: string): string => {
  switch (chainId) {
    case '1': return 'Ethereum Mainnet'
    case '11155111': return 'Sepolia Testnet'
    case '137': return 'Polygon'
    case '8453': return 'Base'
    default: return `Chain ${chainId}`
  }
}

export const getChainNameById = (id: number): string => {
  return getChainName(id.toString())
}