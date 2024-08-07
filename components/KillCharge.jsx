import React, { useState, useEffect } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { createPublicClient, http, parseGwei } from "viem"
import { bsc } from "viem/chains"

const customPublicClient = createPublicClient({
  chain: bsc,
  transport: http("https://bsc-dataseed.binance.org/") // 这是 BSC 的公共 RPC 端点
})

const KILL_CHARGE_ABI = [
  {
    inputs: [
      {
        internalType: "uint256[][]",
        name: "recycle_array",
        type: "uint256[][]"
      },
      {
        internalType: "uint256[]",
        name: "charge_ids",
        type: "uint256[]"
      }
    ],
    name: "batchRecycle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
]

const KILL_CHARGE_CONTRACT_ADDRESS =
  "0xb0952610D1a7A46793f1595a04A4BF077962DD80"

const NFTCollection = ({ nfts }) => {
  const displayNFTs = nfts.slice(0, 1) // 只展示第一个 NFT
  const totalNFTs = nfts.length

  return (
    <div className="w-full rounded-md  overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {displayNFTs.map((nft) => (
          <Card key={nft.tokenId} className="w-full">
            <CardContent className="p-2 sm:p-4">
              <img
                src={nft.roleImage}
                alt={`NFT ${nft.tokenId}`}
                className="w-full h-[150px] sm:h-[200px] object-cover rounded-md mb-2"
              />
              <h3 className="font-semibold text-sm sm:text-base">
                Token ID: {nft.tokenId}
              </h3>
              <p className="text-xs sm:text-sm">Hash Rate: {nft.hashRate}</p>
            </CardContent>
          </Card>
        ))}
        {totalNFTs > 1 && (
          <Card className="w-full bg-opacity-50 backdrop-blur-sm flex items-center justify-center min-h-[150px] sm:min-h-[200px]">
            <CardContent>
              <p className="text-base sm:text-lg font-semibold text-center">
                共 {totalNFTs} 个 NFT
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
export default function KillCharge() {
  const [restingNFTs, setRestingNFTs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { address } = useAccount()
  const publicClient = customPublicClient
  const { data: walletClient } = useWalletClient()

  const [destroyableThreshold, setDestroyableThreshold] = useState(100)
  const [chargeableThreshold, setChargeableThreshold] = useState(1000)

  const [destroyableNFTs, setDestroyableNFTs] = useState([])
  const [chargeableNFTs, setChargeableNFTs] = useState([])

  const [isCharging, setIsCharging] = useState(false)
  const [chargeDays, setChargeDays] = useState("7")

  useEffect(() => {
    const fetchRestingNFTs = async () => {
      if (!address) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/get-restingnft?address=${address}`)
        if (!response.ok) {
          throw new Error("获取数据失败")
        }
        const data = await response.json()
        setRestingNFTs(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRestingNFTs()
  }, [address])

  const updateNFTCollections = () => {
    setDestroyableNFTs(
      restingNFTs.filter((nft) => nft.hashRate < destroyableThreshold)
    )
    setChargeableNFTs(
      restingNFTs.filter((nft) => nft.hashRate > chargeableThreshold)
    )
  }

  useEffect(() => {
    updateNFTCollections()
  }, [restingNFTs, destroyableThreshold, chargeableThreshold])

  const handleCharge = async () => {
    if (!address || !walletClient) {
      setError("请先连接钱包")
      return
    }

    setIsCharging(true)
    setError("")

    try {
      const destroyableIds = destroyableNFTs.map((nft) => nft.tokenId)
      const chargeableIds = chargeableNFTs.map((nft) => nft.tokenId)

      const recycle_array = []
      const charge_ids = []

      const ratio = parseInt(chargeDays)
      const maxChargeCount = 100 // 设置最大充电数量为200

      for (
        let i = 0;
        i <
        Math.min(
          Math.floor(destroyableIds.length / ratio),
          chargeableIds.length,
          maxChargeCount
        );
        i++
      ) {
        recycle_array.push(destroyableIds.slice(i * ratio, (i + 1) * ratio))
        charge_ids.push(chargeableIds[i])
      }

      console.log(recycle_array, charge_ids)
      if (recycle_array.length === 0) {
        throw new Error("没有足够的 NFT 进行充电")
      }
      // console.log("Recycle Array:", recycle_array)
      // console.log("Charge IDs:", charge_ids)
      // console.log("Charge Days:", chargeDays)

      const estimatedGas = await publicClient.estimateContractGas({
        address: KILL_CHARGE_CONTRACT_ADDRESS,
        abi: KILL_CHARGE_ABI,
        functionName: "batchRecycle",
        args: [recycle_array, charge_ids],
        account: address
      })

      // 为了安全起见，将估算的 gas 增加 10%
      const gasLimit = (BigInt(estimatedGas) * BigInt(105)) / BigInt(100)
      console.log("gasLimit", gasLimit)
      const { request } = await publicClient.simulateContract({
        address: KILL_CHARGE_CONTRACT_ADDRESS,
        abi: KILL_CHARGE_ABI,
        functionName: "batchRecycle",
        args: [recycle_array, charge_ids],
        account: address,
        gas: gasLimit, // 使用估算的 gas
        gasPrice: parseGwei("1")
      })

      const hash = await walletClient.writeContract(request)

      await publicClient.waitForTransactionReceipt({ hash })

      alert(
        `充电成功！共为 ${charge_ids.length} 个 NFT 充电 ${chargeDays} 天，销毁了 ${recycle_array.length * ratio} 个 NFT。`
      )
      // 这里可以添加更新 NFT 列表的逻辑
    } catch (err) {
      console.error("充电失败:", err)
      setError(`充电失败，请重试。错误: ${err.message || "未知错误"}`)
    } finally {
      setIsCharging(false)
    }
  }
  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mx-auto max-w-full sm:max-w-3xl lg:max-w-4xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">销毁换电</h2>
      {!address ? (
        <div className="text-center">
          <p className="mb-4 text-sm sm:text-base">
            请先连接您的钱包以使用此功能
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label
                htmlFor="destroyableThreshold"
                className="w-full sm:w-64 text-sm font-medium text-gray-700 mb-2 sm:mb-0"
              >
                可销毁 NFT 的 Hash Rate 上限：
              </label>
              <Input
                id="destroyableThreshold"
                type="number"
                placeholder="输入阈值"
                value={destroyableThreshold}
                onChange={(e) =>
                  setDestroyableThreshold(Number(e.target.value))
                }
                className="w-full sm:w-32"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label
                htmlFor="chargeableThreshold"
                className="w-full sm:w-64 text-sm font-medium text-gray-700 mb-2 sm:mb-0"
              >
                可充电 NFT 的 Hash Rate 下限：
              </label>
              <Input
                id="chargeableThreshold"
                type="number"
                placeholder="输入阈值"
                value={chargeableThreshold}
                onChange={(e) => setChargeableThreshold(Number(e.target.value))}
                className="w-full sm:w-32"
              />
            </div>
          </div>
          {isLoading && <p className="text-sm sm:text-base">加载中...</p>}
          {error && (
            <p className="text-red-500 text-sm sm:text-base">错误: {error}</p>
          )}
          {!isLoading && !error && (
            <div>
              <p className="mb-4 text-sm sm:text-base">
                找到 {restingNFTs.length} 个休眠的 NFT
              </p>

              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                可销毁的 NFT
              </h3>
              {destroyableNFTs.length > 0 ? (
                <NFTCollection nfts={destroyableNFTs} title="可销毁的 NFT" />
              ) : (
                <p className="text-gray-500 text-sm sm:text-base">
                  没有找到可销毁的 NFT
                </p>
              )}

              <h3 className="text-lg sm:text-xl font-semibold my-4">
                可充电的 NFT
              </h3>
              {chargeableNFTs.length > 0 ? (
                <NFTCollection nfts={chargeableNFTs} title="可充电的 NFT" />
              ) : (
                <p className="text-gray-500 text-sm sm:text-base">
                  没有找到可充电的 NFT
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 mb-2">
            <Select value={chargeDays} onValueChange={setChargeDays}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="选择充电天数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1天</SelectItem>
                <SelectItem value="2">2天</SelectItem>
                <SelectItem value="3">3天</SelectItem>
                <SelectItem value="4">4天</SelectItem>
                <SelectItem value="5">5天</SelectItem>
                <SelectItem value="6">6天</SelectItem>
                <SelectItem value="7">7天</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleCharge}
              disabled={
                isCharging ||
                destroyableNFTs.length < parseInt(chargeDays) ||
                chargeableNFTs.length === 0
              }
              className="w-full sm:w-auto"
            >
              {isCharging ? "充电中..." : "一键充电"}
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            注意：每次充电最多处理100台机器，以避免数据过大导致交易卡住。
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            注意：点击按钮后，由于数据量较大，请耐心等待交易弹出。如果无法弹出交易，请刷新页面后重试。
          </p>
          <p className="text-xs sm:text-sm text-red-500 font-semibold mt-1">
            重要：请仔细检查 MetaMask（小狐狸钱包）的 gas 是否设置为 1
            gwei。MetaMask 有时会预设为 3 gwei，这会导致 gas 费用增加三倍。
          </p>
          {error && (
            <p className="text-red-500 mt-2 break-all text-sm sm:text-base">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  )
}
