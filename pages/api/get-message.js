export default async function handler(req, res) {
  const { ethAddress } = req.query

  try {
    const response = await fetch(
      `https://factoryapi.cellula.life/getMessage?ethAddress=${ethAddress}`
    )
    const data = await response.json()

    if (response.ok) {
      res.status(200).json(data)
    } else {
      res.status(response.status).json({ error: "Failed to fetch message" })
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" })
  }
}
