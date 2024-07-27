import { useEffect, useState } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import {
  getDefaultWallets,
  RainbowKitProvider,
  connectorsForWallets
} from "@rainbow-me/rainbowkit"
import {
  arbitrum,
  goerli,
  mainnet,
  optimism,
  polygon,
  zora,
  bsc
} from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import {
  metaMaskWallet,
  okxWallet,
  rainbowWallet,
  coinbaseWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets"

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    bsc,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [goerli] : [])
  ],
  [publicProvider()]
)

const projectId = "928c0944dc8279fb073a7405ecd6b657"
const connectors = connectorsForWallets([
  {
    groupName: "Popular",
    wallets: [
      metaMaskWallet({ projectId, chains }),
      okxWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      coinbaseWallet({ chains, appName: "GasLockR" }),
      walletConnectWallet({ projectId, chains })
    ]
  }
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
})

export function Web3Provider(props) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return (
    <>
      {ready && (
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains}>
            {props.children}
          </RainbowKitProvider>
        </WagmiConfig>
      )}
    </>
  )
}
