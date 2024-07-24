/* global BigInt */
import React, { useState, useEffect } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { parseEther, parseGwei } from "viem"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const NFT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256[][]",
        name: "gene",
        type: "uint256[][]"
      },
      {
        internalType: "uint256",
        name: "quantity",
        type: "uint256"
      }
    ],
    name: "batchCreationBySingleGene",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  }
]

const NFT_CONTRACT_ADDRESS = "0xE62871d9AEa78A2BeD31d985135aC454037b8B2c"

const GeneTable = ({ data, onMint }) => {
  const [quantities, setQuantities] = useState(data.map(() => 100))

  const handleQuantityChange = (index, value) => {
    const newQuantities = [...quantities]
    newQuantities[index] = Math.max(1, parseInt(value) || 1)
    setQuantities(newQuantities)
  }

  return (
    <Table>
      <TableCaption>Gene 数据列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Token ID</TableHead>
          <TableHead>Living Num</TableHead>
          <TableHead>Num Str</TableHead>
          <TableHead>Price (ETH)</TableHead>
          <TableHead>Image</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={item.tokenId}>
            <TableCell>{item.tokenId}</TableCell>
            <TableCell>{item.livingNum}</TableCell>
            <TableCell>{item.numStr}</TableCell>
            <TableCell>{item.price.toFixed(18)}</TableCell>
            <TableCell>
              <Button
                onClick={() => window.open(item.image, "_blank")}
                variant="outline"
                size="sm"
              >
                查看图片
              </Button>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                min="1"
                value={quantities[index]}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                className="w-20"
              />
            </TableCell>
            <TableCell>
              <Button
                onClick={() =>
                  onMint(item.tokenId, item.price, quantities[index])
                }
                variant="default"
                size="sm"
              >
                Mint
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function MintCard() {
  const [, setIsMinting] = useState(false)
  const [error, setError] = useState("")
  const [gene, setGene] = useState(null)
  const [progress, setProgress] = useState(0)
  const [showProgress, setShowProgress] = useState(false)
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  useEffect(() => {
    fetchGene()
  }, [])

  const fetchGene = async () => {
    setShowProgress(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 90))
    }, 100)

    try {
      const response = await fetch("/api/get-gene")
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      setGene(data.gene)
      setProgress(100)
      setTimeout(() => {
        setShowProgress(false)
      }, 1000)
    } catch (error) {
      console.error("获取 gene 失败:", error)
      setError("获取 gene 失败,请重试")
      setShowProgress(false)
    } finally {
      clearInterval(interval)
    }
  }

  const handleMint = async (tokenId, price, quantity) => {
    if (!address || !walletClient) {
      setError("请先连接钱包")
      return
    }

    if (!gene) {
      setError("Gene 数据未加载，请稍后再试")
      return
    }

    setIsMinting(true)
    setError("")

    try {
      const geneData = [
        [tokenId, 1],
        [tokenId, 2]
      ]

      const mintPrice = parseEther(price.toString())
      const originalValue = mintPrice * BigInt(quantity)
      const totalValue = (originalValue * BigInt(142)) / BigInt(100)
      console.log(totalValue)

      const { request } = await publicClient.simulateContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: "batchCreationBySingleGene",
        args: [geneData, quantity],
        account: address,
        value: totalValue,
        gasPrice: parseGwei("1")
      })

      const hash = await walletClient.writeContract(request)

      await publicClient.waitForTransactionReceipt({ hash })

      alert("NFT 铸造成功!")
    } catch (err) {
      console.error("合约调用错误:", err)

      // 打印详细的错误信息
      if (err.cause) {
        console.error("错误原因:", err.cause)
      }

      if (err.data) {
        console.error("错误数据:", err.data)
      }

      if (err.message) {
        console.error("错误消息:", err.message)
      }

      // 如果错误对象包含更多信息，可以继续添加更多的错误属性打印

      setError(`铸造失败，请重试。错误: ${err.message || "未知错误"}`)
    } finally {
      setIsMinting(false)
    }
  }
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mx-auto">
      <h2 className="text-2xl font-bold mb-4">铸造 NFT</h2>
      {showProgress && (
        <div className="mb-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-gray-500 mt-1">
            {progress < 100 ? "正在检查 cellula 数据..." : "加载成功"}
          </p>
        </div>
      )}
      {!showProgress && gene && <GeneTable data={gene} onMint={handleMint} />}
      {error && <p className="text-red-500 mt-2 break-all">{error}</p>}
    </div>
  )
}
