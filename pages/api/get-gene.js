// pages/api/get-gene.js
import { ethers } from "ethers"

export const config = {
  runtime: "edge"
}

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

async function getLifePrice(tokenId) {
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)

  try {
    const cells = [tokenId, tokenId]
    const prices = await contract.getLifePrice(cells)

    const totalPriceInEth = prices.reduce((sum, price) => {
      return sum + Number(ethers.formatEther(price))
    }, 0)

    return totalPriceInEth
  } catch (error) {
    console.error("获取生命价格时出错:", error)
    throw error
  }
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  try {
    const response = await fetch(
      "https://factoryapi.cellula.life/cells?pageNum=1&pageSize=10000"
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    let list = data.data.list

    // 为每个元素添加价格
    for (let item of list) {
      item.price = await getLifePrice(item.tokenId)
    }

    // 按价格升序排序
    list.sort((a, b) => a.price - b.price)

    // 只返回前10个元素
    const topTen = list.slice(0, 10)

    return new Response(JSON.stringify({ gene: topTen }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error processing request:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
}
