import { ConnectButton } from "@rainbow-me/rainbowkit"
import { darkTheme } from "@rainbow-me/rainbowkit"
import Head from "next/head"
import styles from "../styles/Home.module.css"
import MintCard from "@/components/MintCard"
import KillCharge from "@/components/KillCharge"
import { FaTwitter, FaTelegram } from "react-icons/fa" // 导入图标
import Image from "next/image"

const Home = () => {
  const customTheme = darkTheme({
    accentColor: "#44cccc",
    accentColorForeground: "white",
    borderRadius: "medium",
    fontStack: "system",
    overlayBlur: "small"
  })
  return (
    <div className={styles.container}>
      <Head>
        <title>Cellula Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <header className="bg-[#44cccc] text-[#333] border-b-4 rounded-b-3xl border-white pixel-font">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Image
                src="/logo.png"
                alt="Cellula Pro Logo"
                width={180}
                height={124}
                className="w-auto h-12 sm:h-26 rounded-[15px] border-2 shadow-md"
              />
              <div className="flex space-x-4 mt-2 sm:mt-0">
                <a
                  href="https://x.com/cellulapro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:shadow-md"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://t.me/cellulapro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:shadow-md"
                >
                  <FaTelegram size={24} />
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  authenticationStatus,
                  mounted
                }) => {
                  const ready = mounted && authenticationStatus !== "loading"
                  const connected =
                    ready &&
                    account &&
                    chain &&
                    (!authenticationStatus ||
                      authenticationStatus === "authenticated")

                  return (
                    <div
                      {...(!ready && {
                        "aria-hidden": true,
                        style: {
                          opacity: 0,
                          pointerEvents: "none",
                          userSelect: "none"
                        }
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="bg-[#44cccc] text-white font-bold border-2 border-white rounded-xl px-4 py-2 hover:bg-[#3ab8b8]"
                            >
                              连接钱包
                            </button>
                          )
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              type="button"
                              className="bg-red-500 text-white border-2 border-white rounded-md px-4 py-2 hover:bg-red-600"
                            >
                              错误网络
                            </button>
                          )
                        }

                        return (
                          <div style={{ display: "flex", gap: 12 }}>
                            <button
                              onClick={openChainModal}
                              style={{ display: "flex", alignItems: "center" }}
                              type="button"
                              className="bg-[#44cccc] text-white border-2 border-white rounded-md px-4 py-2 hover:bg-[#3ab8b8]"
                            >
                              {chain.hasIcon && (
                                <div
                                  style={{
                                    background: chain.iconBackground,
                                    width: 12,
                                    height: 12,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                    marginRight: 4
                                  }}
                                >
                                  {chain.iconUrl && (
                                    <img
                                      alt={chain.name ?? "Chain icon"}
                                      src={chain.iconUrl}
                                      style={{ width: 12, height: 12 }}
                                    />
                                  )}
                                </div>
                              )}
                              {chain.name}
                            </button>

                            <button
                              onClick={openAccountModal}
                              type="button"
                              className="bg-[#44cccc] text-white border-2 border-white rounded-md px-4 py-2 hover:bg-[#3ab8b8]"
                            >
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ""}
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </header>
      <main
        className={`${styles.main} bg-white min-h-screen flex flex-col p-4 sm:p-6 lg:p-8`}
      >
        <div className="flex-1 w-full h-full flex justify-center">
          {/* 修改这里 */}
          <div
            role="tablist"
            className="tabs tabs-lifted h-full w-full max-w-4xl"
          >
            <input
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab"
              aria-label="Mint"
              defaultChecked
            />
            <div
              role="tabpanel"
              className="tab-content bg-base-100 border-base-300 rounded-box p-4 sm:p-6"
            >
              <MintCard />
            </div>

            <input
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab"
              aria-label="Charge"
            />
            <div
              role="tabpanel"
              className="tab-content bg-base-100 border-base-300 rounded-box p-4 sm:p-6"
            >
              <KillCharge />
            </div>
          </div>
        </div>
      </main>

      <footer className={`${styles.footer} p-4 text-center`}>
        <a
          href="https://rainbow.me"
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm sm:text-base"
        >
          Made with ❤️ by cellula frens
        </a>
      </footer>
    </div>
  )
}

export default Home
