import https from 'https';

function callOpenAI(apiKey, text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: 'omni-moderation-latest',
      input: text,
    });

    const options = {
      hostname: 'api.openai.com',
      path: '/v1/moderations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        resolve({ status: response.statusCode, body: data });
      });
    });

    request.on('error', (err) => reject(err));
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
    request.write(postData);
    request.end();
  });
}

export default async function handler(req, res) {
  // CORS - permitir www y non-www
  const allowedOrigins = ['https://www.ipnprofes.com', 'https://ipnprofes.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ ok: false, error: 'API key no configurada' });
    }

    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return res.status(400).json({ ok: false, error: 'Texto inválido' });
    }

    const textoLimitado = text.slice(0, 2500);

    const response = await callOpenAI(apiKey, textoLimitado);

    if (response.status !== 200) {
      console.error('OpenAI error:', response.status, response.body);
      return res.status(502).json({
        ok: false,
        error: 'Error en servicio de moderación',
        debug: `OpenAI status: ${response.status}`,
      });
    }

    const data = JSON.parse(response.body);
    const result = data.results?.[0];

    if (!result) {
      return res.status(502).json({ ok: false, error: 'Respuesta inesperada del servicio' });
    }

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
    console.error('Moderation handler error:', error.message || error);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}
}
