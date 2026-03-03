import { createClient } from '@supabase/supabase-js';

/**
 * Serverless function that serves HTML with Open Graph meta tags
 * to social media crawlers for professor profile previews.
 * 
 * Only bots reach this endpoint (via conditional rewrite in vercel.json).
 * Regular users get the SPA directly.
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(302, '/');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Fallback: serve basic HTML with default OG tags
    return serveFallbackHTML(res, slug);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: profesor, error } = await supabase
      .from('ranking_profesores')
      .select('nombre_completo, slug, calificacion_promedio, total_evaluaciones, porcentaje_recomendacion')
      .eq('slug', slug)
      .single();

    if (error || !profesor) {
      return serveFallbackHTML(res, slug);
    }

    const nombre = profesor.nombre_completo;
    const calificacion = profesor.calificacion_promedio
      ? Number(profesor.calificacion_promedio).toFixed(1)
      : 'Sin evaluar';
    const evaluaciones = profesor.total_evaluaciones || 0;
    const recomendacion = Math.round(profesor.porcentaje_recomendacion || 0);

    const title = `${nombre} — ${calificacion}/10 | ipnprofes`;
    const description = `Calificacion: ${calificacion}/10 · ${evaluaciones} evaluaciones · ${recomendacion}% lo recomienda. Mira las opiniones de estudiantes del IPN sobre ${nombre}.`;
    const url = `https://ipnprofes.com/profesor/${slug}`;
    const ogImageUrl = `https://ipnprofes.com/api/og-image/profesor?nombre=${encodeURIComponent(nombre)}&calificacion=${encodeURIComponent(calificacion)}&evaluaciones=${evaluaciones}&recomendacion=${recomendacion}`;

    const html = buildHTML({
      title,
      description,
      url,
      ogImageUrl,
      type: 'profile',
      siteName: 'ipnprofes',
      redirectUrl: url,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(html);
  } catch (err) {
    return serveFallbackHTML(res, slug);
  }
}

function serveFallbackHTML(res, slug) {
  const url = `https://ipnprofes.com/profesor/${slug}`;
  const html = buildHTML({
    title: 'Perfil de Profesor | ipnprofes',
    description: 'Evalua profesores del IPN de forma 100% anonima. Mira calificaciones, evaluaciones y opiniones de la comunidad politecnica.',
    url,
    ogImageUrl: 'https://ipnprofes.com/ipnprofes1200x630.png',
    type: 'website',
    siteName: 'ipnprofes',
    redirectUrl: url,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return res.status(200).send(html);
}

function buildHTML({ title, description, url, ogImageUrl, type, siteName, redirectUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">

  <!-- Open Graph -->
  <meta property="og:type" content="${type}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(ogImageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:locale" content="es_MX">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImageUrl)}">

  <!-- Canonical -->
  <link rel="canonical" href="${esc(url)}">

  <!-- Instant redirect for any user that lands here -->
  <meta http-equiv="refresh" content="0;url=${esc(redirectUrl)}">
</head>
<body>
  <p>Redirigiendo a <a href="${esc(redirectUrl)}">${esc(title)}</a>...</p>
</body>
</html>`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
