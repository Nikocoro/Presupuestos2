import { getDb } from '../lib/db.js'
import { setCors } from '../lib/cors.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const db = await getDb()
    const col = db.collection('profesionales')

    if (req.method === 'GET') {
      const profs = await col.find({}).sort({ nombre: 1 }).toArray()
      return res.status(200).json(profs)
    }

    if (req.method === 'POST') {
      const prof = { ...(req.body || {}), createdAt: new Date() }
      const result = await col.insertOne(prof)
      return res.status(201).json({ ...prof, _id: result.insertedId })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Falta el parámetro id' })
      await col.deleteOne({ id })
      return res.status(200).json({ deleted: true })
    }

    return res.status(405).json({ error: 'Método no permitido' })
  } catch (e) {
    console.error('[profesionales]', e)
    return res.status(500).json({ error: e.message })
  }
}
