// Route-specific validation specs

export const mergeSpec = {
  dao: "addr", 
  plugin: "addr", 
  signal: "addr",
  chainId: "int", 
  repoUrl: "str", 
  pr: "int", 
  action: "str", 
  target: "str",
} as const

export const joinSpec = {
  chainId: "int", 
  faucet: "addr", 
  token: "addr", 
  amount: "dec", 
  decimals: "int",
} as const

export const proposeFaucetSpec = {
  dao: "addr",
  plugin: "addr", 
  token: "addr",
  faucet: "addr",
  chainId: "int",
} as const