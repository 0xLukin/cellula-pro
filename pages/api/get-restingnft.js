// 文件名: pages/api/get-restingnft.js

export const config = {
  runtime: "edge"
}

export default async function handler(req) {
  if (req.method === "GET") {
    const url = new URL(req.url)
    const address = url.searchParams.get("address")

    if (!address) {
      return new Response(JSON.stringify({ error: "缺少地址参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    try {
      const token = "afb4ec71-15b7-4c4d-b32e-5d852bb0e9e4-1723646622094"
      const response = await fetch(
        `https://factoryapi.cellula.life/myRestingLives?ethAddress=${address}&pageSize=100000`,
        {
          method: "GET", // 或者 "POST" 等其他请求方法
          headers: {
            "Content-Type": "application/json", // 如果需要发送 JSON 数据
            Token: token // 添加 Authorization 请求头
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.code === 200 && data.data && data.data.list) {
        return new Response(JSON.stringify(data.data.list), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      } else {
        return new Response(
          JSON.stringify({ error: "获取数据失败", message: data.message }),
          { status: data.code, headers: { "Content-Type": "application/json" } }
        )
      }
    } catch (error) {
      console.error("请求失败:", error)
      return new Response(
        JSON.stringify({ error: "服务器错误", message: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }
  } else {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: ["GET"],
        "Content-Type": "application/json"
      }
    })
  }
}
