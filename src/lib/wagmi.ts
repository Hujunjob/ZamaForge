import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id';

export const config = getDefaultConfig({
  appName: 'ZamaForge',
  projectId,
  chains: [sepolia],
  ssr: false,
});