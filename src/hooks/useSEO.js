import { useEffect } from 'react';

/**
 * Hook para actualizar meta tags dinámicamente (incluido OG image)
 * @param {string} title - Título de la página
 * @param {string} description - Descripción de la página
 * @param {string} [keywords] - Keywords opcionales
 * @param {Object} [options] - Opciones adicionales para OG tags
 * @param {string} [options.ogImage] - URL de la imagen OG dinámica
 * @param {string} [options.ogUrl] - URL canónica de la página
 * @param {string} [options.ogType] - Tipo OG (website, profile, article, event)
 */
export const useSEO = (title, description, keywords = '', options = {}) => {
  useEffect(() => {
    // Actualizar título
    document.title = title;

    // Actualizar meta description
    updateMeta('name', 'description', description);

    // Actualizar keywords si se proporcionan
    if (keywords) {
      updateMeta('name', 'keywords', keywords);
    }

    // Actualizar Open Graph tags
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);

    if (options.ogImage) {
      updateMeta('property', 'og:image', options.ogImage);
      updateMeta('property', 'og:image:width', '1200');
      updateMeta('property', 'og:image:height', '630');
    }

    if (options.ogUrl) {
      updateMeta('property', 'og:url', options.ogUrl);
      // Also update canonical
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = options.ogUrl;
    }

    if (options.ogType) {
      updateMeta('property', 'og:type', options.ogType);
    }

    // Actualizar Twitter tags
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);

    if (options.ogImage) {
      updateMeta('name', 'twitter:image', options.ogImage);
    }
  }, [title, description, keywords, options.ogImage, options.ogUrl, options.ogType]);
};

/**
 * Helper para crear o actualizar meta tags
 */
function updateMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}
