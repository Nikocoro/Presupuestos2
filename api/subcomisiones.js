import { getDb } from '../lib/db.js'
import { setCors } from '../lib/cors.js'

const DEFAULT_SUBCOMISIONES = [
  { id: 'proyectos', nombre: 'Comisión de Proyectos' },
  { id: 'fiestas', nombre: 'Fiestas' },
]

const normalize = (subco) => ({
  id: String(subco.id || subco.slug || subco._id),
  nombre: subco.nombre || subco.name || subco.titulo || 'Subcomisión sin nombre',
})

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' })

    const db = await getDb()
    const col = db.collection('subcomisiones')
    const subcos = await col.find({}).sort({ nombre: 1 }).toArray()

    return res.status(200).json(subcos.length > 0 ? subcos.map(normalize) : DEFAULT_SUBCOMISIONES)
  } catch (e) {
    console.error('[subcomisiones]', e)
    return res.status(200).json(DEFAULT_SUBCOMISIONES)
  }
}
