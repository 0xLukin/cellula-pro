// pages/api/get-gene.js
import axios from "axios"
import { ethers } from "ethers"

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

// BSC 主网 RPC URL
const RPC_URL = "https://bsc-dataseed.binance.org/"

async function getLifePrice(tokenId) {
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

  try {
    const cells = [tokenId, tokenId]
    const prices = await contract.getLifePrice(cells)

    // 将 BigInt 转换为 ETH 单位并相加
    const totalPriceInEth = prices.reduce((sum, price) => {
      return sum + Number(ethers.formatEther(price))
    }, 0)

    return totalPriceInEth
  } catch (error) {
    console.error("获取生命价格时出错:", error)
    throw error
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const response = await axios.get(
        "https://factoryapi.cellula.life/cells?pageNum=1&pageSize=10000"
      )
      let list = response.data.data.list

      // 为每个元素添加价格
      for (let item of list) {
        item.price = await getLifePrice(item.tokenId)
      }

      // 按价格升序排序
      list.sort((a, b) => a.price - b.price)

      // 只返回前10个元素作为示例
      const topTen = list.slice(0, 10)

      res.status(200).json({ gene: topTen })
    } catch (error) {
      console.error("Error processing request:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  } else {
    res.setHeader("Allow", ["GET"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
