const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const incidents = []

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'crisisconnect-backend',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/incidents', (_req, res) => {
  const sorted = [...incidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  res.status(200).json({
    data: sorted,
  })
})

app.post('/api/incidents', (req, res) => {
  const now = new Date().toISOString()
  const incident = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
    type: req.body.type ?? 'SOS',
    status: req.body.status ?? 'pending',
    lat: Number(req.body.lat ?? 0),
    lng: Number(req.body.lng ?? 0),
    priority: req.body.priority,
    title: req.body.title,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    reporterPhone: req.body.reporterPhone,
    responderId: req.body.responderId,
    createdAt: req.body.createdAt ?? now,
    updatedAt: now,
  }

  incidents.push(incident)
  res.status(201).json({ data: incident })
})

app.patch('/api/incidents/:id', (req, res) => {
  const incidentIndex = incidents.findIndex((entry) => entry.id === req.params.id)
  if (incidentIndex === -1) {
    res.status(404).json({ error: 'Incident not found' })
    return
  }

  incidents[incidentIndex] = {
    ...incidents[incidentIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  }

  res.status(200).json({ data: incidents[incidentIndex] })
})

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CrisisConnect backend running on http://localhost:${PORT}`)
})
