import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './lib/wagmi'
import { ZamaSDKProvider } from './contexts/ZamaSDKContext'
import { RainbowKitWrapper } from './components/RainbowKitWrapper'
import App from './App.tsx'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css'
import './i18n/config'

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitWrapper>
        <ZamaSDKProvider>
          <App />
        </ZamaSDKProvider>
      </RainbowKitWrapper>
    </QueryClientProvider>
  </WagmiProvider>
);
