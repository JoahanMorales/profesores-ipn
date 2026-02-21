export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  // Test: verificar que la función se ejecuta
  const apiKey = process.env.OPENAI_API_KEY;
  const hasKey = !!apiKey;
  const keyPrefix = apiKey ? apiKey.slice(0, 8) + '...' : 'NO KEY';

  const body = req.body;
  const text = body?.text;

  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return res.status(400).json({ ok: false, error: 'Texto inválido', hasKey, keyPrefix });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: text.slice(0, 2500),
      }),
    });

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'OpenAI error',
        status: openaiRes.status,
        body: rawText.slice(0, 500),
      });
    }

    const data = JSON.parse(rawText);
    const result = data.results && data.results[0];

    if (!result) {
      return res.status(502).json({ ok: false, error: 'No results', raw: rawText.slice(0, 300) });
    }

    const scores = result.category_scores || {};
    const maxScore = Math.max(
      scores.hate || 0,
      scores.harassment || 0,
      scores['harassment/threatening'] || 0,
      scores['hate/threatening'] || 0,
      scores.violence || 0,
      scores['violence/graphic'] || 0,
      scores['self-harm'] || 0,
      scores.sexual || 0
    );

    return res.status(200).json({
      ok: true,
      flagged: result.flagged,
      max_score: parseFloat(maxScore.toFixed(4)),
      categories: result.categories,
      category_scores: scores,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: 'catch: ' + (err.message || String(err)),
    });
  }
}
}
