import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Cogni Proposal Launcher',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    mainnet,
    sepolia, // Always include Sepolia for governance proposals
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});
