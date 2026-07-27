import { setCors } from '../lib/cors.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[analyze] GEMINI_API_KEY no está configurada en las variables de entorno de Vercel.')
    return res.status(500).json({
      error: 'GEMINI_API_KEY no configurada. Agregala en Vercel → Settings → Environment Variables.',
    })
  }

  const text = req.body?.text
  if (!text) {
    return res.status(400).json({ error: 'El campo "text" está vacío.' })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`

  let geminiRes
  try {
    geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: `Sos un asistente que extrae ítems que requieren presupuesto de actas de reunión en español argentino.
Devolvé ÚNICAMENTE un array JSON con objetos: { "item": string, "contexto": string }.
"item": nombre concreto del material, producto o servicio a presupuestar.
"contexto": detalle relevante (ej: "casa 11 y 12") o string vacío si no hay.
Solo incluí ítems que necesiten cotización real. Ignorá tareas, personas y decisiones.
Sin markdown ni texto extra. Solo el JSON puro.`
          }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: `Extraé los ítems que necesitan presupuesto:\n\n${text}` }]
        }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
      }),
    })
  } catch (e) {
    console.error('[analyze] Error al llamar a Gemini:', e.message)
    return res.status(502).json({ error: `No se pudo contactar a Gemini: ${e.message}` })
  }

  const geminiBody = await geminiRes.text()

  if (!geminiRes.ok) {
    console.error(`[analyze] Gemini respondió ${geminiRes.status}:`, geminiBody)
    return res.status(502).json({ error: `Gemini API error ${geminiRes.status}: ${geminiBody}` })
  }

  try {
    const data = JSON.parse(geminiBody)
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    const items = JSON.parse(raw.replace(/```json|```/g, '').trim())
    return res.status(200).json({ items })
  } catch (e) {
    console.error('[analyze] Error al parsear respuesta de Gemini:', geminiBody)
    return res.status(500).json({ error: `Error al interpretar la respuesta de Gemini: ${e.message}` })
  }
}
