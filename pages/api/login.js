export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const response = await fetch("https://factoryapi.cellula.life/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      })

      const data = await response.json()

      if (response.ok) {
        res.status(200).json(data)
      } else {
        res.status(response.status).json({ error: "Login failed" })
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
