import { getDb } from '../lib/db.js'
import { setCors } from '../lib/cors.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()
    const col = db.collection('items')
    const subcoId = req.query.subcoId

    if (req.method === 'GET') {
      if (!subcoId) return res.status(400).json({ error: 'Falta el parámetro subcoId' })
      const items = await col.find({ subcoId }).sort({ createdAt: 1 }).toArray()
      return res.status(200).json(items)
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      if (!body.subcoId) return res.status(400).json({ error: 'Falta el campo subcoId' })
      const item = { ...body, createdAt: new Date() }
      const result = await col.insertOne(item)
      return res.status(201).json({ ...item, _id: result.insertedId })
    }

    if (req.method === 'PUT') {
      const { id, ...fields } = req.body || {}
      if (!id) return res.status(400).json({ error: 'Falta el campo id' })
      const filter = fields.subcoId ? { id, subcoId: fields.subcoId } : { id }
      await col.updateOne(filter, { $set: { ...fields, updatedAt: new Date() } })
      return res.status(200).json({ updated: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })
      const filter = subcoId ? { id, subcoId } : { id }
      await col.deleteOne(filter)
      return res.status(200).json({ deleted: true })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (e) {
    console.error('[items]', e)
    return res.status(500).json({ error: e.message })
  }
}
