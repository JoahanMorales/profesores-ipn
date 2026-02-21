export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.ipnprofes.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'Configuración de moderación no disponible' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return res.status(400).json({ ok: false, error: 'Texto inválido' });
  }

  // Limitar longitud para evitar abuso
  const textoLimitado = text.slice(0, 2500);

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: textoLimitado,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI Moderation API error:', response.status, errorData);
      return res.status(502).json({ ok: false, error: 'Error en servicio de moderación' });
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      return res.status(502).json({ ok: false, error: 'Respuesta inesperada del servicio' });
    }

    // Extraer los scores relevantes
    const scores = result.category_scores || {};
    const maxScore = Math.max(
      scores.hate || 0,
      scores.harassment || 0,
      scores['harassment/threatening'] || 0,
      scores['hate/threatening'] || 0,
      scores['violence'] || 0,
      scores['violence/graphic'] || 0,
      scores['self-harm'] || 0,
      scores['sexual'] || 0,
    );

    return res.status(200).json({
      ok: true,
      flagged: result.flagged,
      max_score: parseFloat(maxScore.toFixed(4)),
      categories: result.categories,
      category_scores: scores,
    });
  } catch (error) {
    console.error('Error calling moderation API:', error);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
}
