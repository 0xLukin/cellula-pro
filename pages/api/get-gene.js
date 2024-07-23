import { aggregate } from "@makerdao/multicall"
import { ethers } from "ethers"
import fetch from "node-fetch" // 引入 node-fetch

const CONTRACT_ADDRESS = "0xa258107Cb9dCD325a37c7d65A7f4850bb9986BC6"
const ABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: "uint256[]",
        name: "cells_",
        type: "uint256[]"
      }
    ],
    name: "getLifePrice",
    outputs: [
      {
        internalType: "uint256[]",
        name: "cellsPrice",
        type: "uint256[]"
      }
    ],
    payable: false,
    stateMutability: "view",
    type: "function"
  }
]

const RPC_URL = "https://bsc-dataseed.binance.org/"

async function getLifePrices(tokenIds) {
  const calls = tokenIds.map((tokenId) => ({
    target: CONTRACT_ADDRESS,
    call: ["getLifePrice(uint256[])(uint256[])", [tokenId, tokenId]],
    returns: [[`price-${tokenId}`]]
  }))

  const config = {
    rpcUrl: RPC_URL,
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11"
  }

  const { results } = await aggregate(calls, config)

  const prices = {}
  for (const tokenId of tokenIds) {
    const rawPrice = results.original[`price-${tokenId}`][0]
    if (rawPrice) {
      // 在 ethers v6 中，我们使用 ethers.parseUnits 来创建 BigInt
      const bigIntPrice = ethers.parseUnits(rawPrice.toString(), "wei")
      // 使用 ethers.formatEther 来将 BigInt 转换为以太单位的字符串
      prices[tokenId] = ethers.formatEther(bigIntPrice) * 2
    } else {
      prices[tokenId] = "0"
    }
  }

  return prices
}
export default async function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).send("Method Not Allowed")
  }

  try {
    const res = await fetch(
      "https://factoryapi.cellula.life/cells?pageNum=1&pageSize=10000"
    )
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const data = await res.json()
    let list = data.data.list

    // 获取所有tokenId
    const tokenIds = list.map((item) => item.tokenId)

    // 批量获取价格
    const prices = await getLifePrices(tokenIds)

    // 将价格添加到列表中
    list = list.map((item) => ({
      ...item,
      price: Number(prices[item.tokenId])
    }))

    // 按价格升序排序
    list.sort((a, b) => a.price - b.price)

    // 只返回前10个元素
    const topTen = list.slice(0, 10)

    return response.status(200).json({ gene: topTen })
  } catch (error) {
    console.error("Error processing request:", error)
    return response.status(500).json({ error: "Internal server error" })
  }
}
