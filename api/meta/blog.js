import { createClient } from '@supabase/supabase-js';

/**
 * Serverless function that serves HTML with Open Graph meta tags
 * to social media crawlers for blog article previews.
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.redirect(302, '/blog');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return serveFallbackHTML(res, slug);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: articulo, error } = await supabase
      .from('blog_posts')
      .select('titulo, slug, resumen, categoria, autor, tiempo_lectura')
      .eq('slug', slug)
      .eq('publicado', true)
      .single();

    if (error || !articulo) {
      return serveFallbackHTML(res, slug);
    }

    const title = `${articulo.titulo} | Blog ipnprofes`;
    const description = articulo.resumen || `Articulo sobre ${articulo.categoria} en el blog de ipnprofes.`;
    const url = `https://ipnprofes.com/blog/${slug}`;
    const ogImageUrl = `https://ipnprofes.com/api/og-image/blog?titulo=${encodeURIComponent(articulo.titulo)}&resumen=${encodeURIComponent(articulo.resumen || '')}&categoria=${encodeURIComponent(articulo.categoria || 'General')}&autor=${encodeURIComponent(articulo.autor || 'IPNProfes')}&tiempo=${encodeURIComponent(articulo.tiempo_lectura || '5 min')}`;

    const html = buildHTML({
      title,
      description,
      url,
      ogImageUrl,
      type: 'article',
      siteName: 'ipnprofes',
      redirectUrl: url,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200, max-age=0');
    return res.status(200).send(html);
  } catch (err) {
    return serveFallbackHTML(res, slug);
  }
}

function serveFallbackHTML(res, slug) {
  const url = `https://ipnprofes.com/blog/${slug}`;
  const html = buildHTML({
    title: 'Blog | ipnprofes',
    description: 'Articulos, guias y datos interesantes sobre la vida politecnica, el SAES y la comunidad del IPN.',
    url,
    ogImageUrl: 'https://ipnprofes.com/ipnprofes1200x630.png',
    type: 'article',
    siteName: 'ipnprofes',
    redirectUrl: url,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200, max-age=0');
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
