import { createClient } from '@supabase/supabase-js';

/**
 * Serverless function that serves HTML with Open Graph meta tags
 * to social media crawlers for event previews.
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(302, '/eventos');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return serveFallbackHTML(res, slug);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: evento, error } = await supabase
      .from('eventos')
      .select('titulo, slug, descripcion, fecha_inicio, fecha_fin, hora, lugar, categoria, destacado')
      .eq('slug', slug)
      .eq('publicado', true)
      .single();

    if (error || !evento) {
      return serveFallbackHTML(res, slug);
    }

    // Format date for display
    const fechaTexto = formatFecha(evento.fecha_inicio, evento.fecha_fin);

    const title = `${evento.titulo} | Eventos ipnprofes`;
    const description = evento.descripcion
      ? (evento.descripcion.length > 200 ? evento.descripcion.slice(0, 197) + '...' : evento.descripcion)
      : `Evento de la comunidad politecnica del IPN.`;
    const url = `https://ipnprofes.com/eventos/${slug}`;
    const ogImageUrl = `https://ipnprofes.com/api/og-image/evento?titulo=${encodeURIComponent(evento.titulo)}&fecha=${encodeURIComponent(fechaTexto)}&lugar=${encodeURIComponent(evento.lugar || '')}&hora=${encodeURIComponent(evento.hora || '')}&categoria=${encodeURIComponent(evento.categoria || 'General')}&destacado=${evento.destacado ? 'true' : 'false'}`;

    const html = buildHTML({
      title,
      description,
      url,
      ogImageUrl,
      type: 'event',
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

function formatFecha(inicio, fin) {
  if (!inicio) return '';
  try {
    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    const fi = new Date(inicio + 'T00:00:00').toLocaleDateString('es-MX', opts);
    if (!fin || fin === inicio) return fi;
    const ff = new Date(fin + 'T00:00:00').toLocaleDateString('es-MX', opts);
    return `${fi} — ${ff}`;
  } catch {
    return inicio;
  }
}

function serveFallbackHTML(res, slug) {
  const url = `https://ipnprofes.com/eventos/${slug}`;
  const html = buildHTML({
    title: 'Eventos | ipnprofes',
    description: 'Eventos, actividades y encuentros de la comunidad politecnica del IPN.',
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
