// pages/api/energyLeaderboard.js

export const config = {
  runtime: "edge" // 指定在 Edge Runtime 上运行
}

const OKLINK_API_KEY = "bd571a43-7e0d-4626-a4b3-a46b567cfa60" // 替换为您的 Oklink API 密钥
const TOKEN_CONTRACT_ADDRESS = "0xabd1780208a62b9cbf9d3b7a1617918d42493933" // 替换为您的合约地址
const MAX_ADDRESSES = 400 // 需要获取的地址总数
const LIMIT = 100 // 每次请求的地址数量

async function fetchAddresses() {
  const addresses = []
  let page = 1

  while (addresses.length < MAX_ADDRESSES) {
    const url = new URL(
      "https://www.oklink.com/api/v5/explorer/token/position-list"
    )
    url.searchParams.append("chainShortName", "BSC")
    url.searchParams.append("tokenContractAddress", TOKEN_CONTRACT_ADDRESS)
    url.searchParams.append("page", page.toString())
    url.searchParams.append("limit", LIMIT.toString())

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Ok-Access-Key": OKLINK_API_KEY
      }
    })

    const data = await response.json()

    // 检查响应是否包含错误
    if (data.code !== "0") {
      console.error(`Error fetching addresses: ${data.msg}`)
      throw new Error(data.msg) // 抛出错误以便后续处理
    }

    const positionList = data.data[0].positionList || [] // 确保 positionList 是数组
    addresses.push(...positionList.map((item) => item.holderAddress)) // 提取持有者地址并添加到数组中

    // 如果返回的地址数量少于 LIMIT，说明没有更多地址了，退出循环
    if (positionList.length < LIMIT) {
      break
    }

    page++ // 增加页码以获取下一页
  }
  console.log(addresses.length)
  return addresses.slice(0, MAX_ADDRESSES) // 返回前 MAX_ADDRESSES 个地址
}

async function fetchEnergy(address) {
  const response = await fetch(
    `https://factoryapi.cellula.life/miningInfo?ethAddress=${address}`
  )

  const data = await response.json()
  const { myEnergy, waitClaimEnergy } = data.data
  return {
    address,
    totalEnergy: myEnergy + waitClaimEnergy
  }
}

export default async function handler(req) {
  try {
    // 获取 NFT 持有者地址
    const addresses = await fetchAddresses()

    // 获取每个地址的能量信息
    const energyData = await Promise.all(addresses.map(fetchEnergy))

    // 按能量排序并取前50
    const leaderboard = energyData
      .sort((a, b) => b.totalEnergy - a.totalEnergy)
      .slice(0, 50)

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ message: "获取能量排行榜失败" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    })
  }
}
