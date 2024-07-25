// 文件名: pages/api/get-restingnft.js

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { address } = req.query

    if (!address) {
      return res.status(400).json({ error: "缺少地址参数" })
    }

    try {
      const response = await fetch(
        `https://factoryapi.cellula.life/myRestingLives?ethAddress=${address}&pageSize=100000`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.code === 200 && data.data && data.data.list) {
        return res.status(200).json(data.data.list)
      } else {
        return res
          .status(data.code)
          .json({ error: "获取数据失败", message: data.message })
      }
    } catch (error) {
      console.error("请求失败:", error)
      return res
        .status(500)
        .json({ error: "服务器错误", message: error.message })
    }
  } else {
    res.setHeader("Allow", ["GET"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
