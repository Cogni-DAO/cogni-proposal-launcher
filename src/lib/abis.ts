// Contract ABIs for proposal creation

export const COGNI_SIGNAL_ABI = [
  {
    "type": "function",
    "name": "signal",
    "inputs": [
      {"name": "vcs", "type": "string", "internalType": "string"},
      {"name": "repoUrl", "type": "string", "internalType": "string"},
      {"name": "action", "type": "string", "internalType": "string"},
      {"name": "target", "type": "string", "internalType": "string"},
      {"name": "resource", "type": "string", "internalType": "string"},
      {"name": "extra", "type": "bytes", "internalType": "bytes"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const

export const TOKEN_VOTING_ABI = [
  {
    "type": "function",
    "name": "createProposal",
    "inputs": [
      {"name": "_metadata", "type": "bytes", "internalType": "bytes"},
      {
        "name": "_actions",
        "type": "tuple[]",
        "internalType": "struct Action[]",
        "components": [
          {"name": "to", "type": "address", "internalType": "address"},
          {"name": "value", "type": "uint256", "internalType": "uint256"},
          {"name": "data", "type": "bytes", "internalType": "bytes"}
        ]
      },
      {"name": "_allowFailureMap", "type": "uint256", "internalType": "uint256"},
      {"name": "_startDate", "type": "uint64", "internalType": "uint64"},
      {"name": "_endDate", "type": "uint64", "internalType": "uint64"},
      {"name": "_voteOption", "type": "uint8", "internalType": "enum IMajorityVoting.VoteOption"},
      {"name": "_tryEarlyExecution", "type": "bool", "internalType": "bool"}
    ],
    "outputs": [
      {"name": "proposalId", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "nonpayable"
  }
] as const

export const FAUCET_ABI = [
  {
    "type": "function",
    "name": "claim",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", 
    "name": "hasClaimed",
    "inputs": [{"name": "claimer", "type": "address", "internalType": "address"}],
    "outputs": [{"type": "bool", "internalType": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "remainingTokens",
    "inputs": [],
    "outputs": [{"type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Claimed",
    "inputs": [
      {"name": "claimer", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ]
  },
  {
    "type": "error",
    "name": "AlreadyClaimed",
    "inputs": [{"name": "claimer", "type": "address", "internalType": "address"}]
  },
  {
    "type": "error", 
    "name": "FaucetPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GlobalCapExceeded", 
    "inputs": [
      {"name": "requested", "type": "uint256", "internalType": "uint256"}, 
      {"name": "available", "type": "uint256", "internalType": "uint256"}
    ]
  }
] as const