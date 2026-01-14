# Guía de Despliegue en Vercel - ip

## Preparación Previa

### 1. Instalar Vercel CLI (Opcional)
```bash
npm install -g vercel
```

### 2. Variables de Entorno Necesarias

En Vercel Dashboard, debes configurar estas variables:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

**NO subas el archivo `.env` a Git**

## Despliegue Rápido

### Opción 1: Desde GitHub (Recomendado)

1. **Conecta tu repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Selecciona el framework: **Vite**

2. **Configura las variables de entorno:**
   - En "Environment Variables" agrega:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Deploy:**
   - Haz clic en "Deploy"
   - Vercel detectará automáticamente la configuración de Vite

### Opción 2: Desde CLI

```bash
# Login en Vercel
vercel login

# Deploy (desde la raíz del proyecto)
vercel

# Sigue las instrucciones:
# - Set up and deploy? [Y]
# - Which scope? [Tu cuenta]
# - Link to existing project? [N]
# - What's your project's name? [ip o tu preferencia]
# - In which directory is your code located? [./]

# Configura variables de entorno
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy a producción
vercel --prod
```

## Configuración de Vercel

### vercel.json (Ya está configurado)

El archivo `vercel.json` ya incluye:
- Redirecciones para SPA (Single Page Application)
- Configuración de headers de seguridad
- Optimizaciones de caché

### Build Settings

Vercel detectará automáticamente:
- **Framework Preset:** Vite
- **Build Command:** `npm run build` o `vite build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Google AdSense y Analytics

### 1. Obtener IDs

#### Google Analytics:
1. Ve a [analytics.google.com](https://analytics.google.com)
2. Crea una propiedad GA4
3. Copia tu Measurement ID (formato: `G-XXXXXXXXXX`)

#### Google AdSense:
1. Ve a [adsense.google.com](https://adsense.google.com)
2. Agrega tu sitio web
3. Copia tu Publisher ID (formato: `ca-pub-XXXXXXXXXXXXXXXX`)

### 2. Actualizar index.html

Reemplaza en [index.html](index.html):

```html
<!-- Línea ~39: Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TU-ID-AQUI"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TU-ID-AQUI', {
    page_path: window.location.pathname,
    anonymize_ip: true
  });
</script>

<!-- Línea ~51: Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-TU-ID-AQUI"
 crossorigin="anonymous"></script>
```

### 3. Tracking Analytics

El archivo `src/lib/analytics.js` ya está configurado para tracking automático:

```javascript
import { trackLogin, trackSearch, trackEvaluation } from '../lib/analytics';

// En tus componentes:
trackLogin(); // Al iniciar sesión
trackSearch('nombre del profesor'); // Al buscar
trackEvaluation('nombre del profesor'); // Al evaluar
```

## Optimizaciones Implementadas

✅ **Lazy Loading:** Componentes cargados bajo demanda
✅ **Code Splitting:** Chunks separados por funcionalidad
✅ **Minificación:** Terser elimina console.logs y reduce tamaño
✅ **Cache Strategy:** 7 días para datos estáticos, 5 min para búsquedas
✅ **Skeleton Loaders:** Mejoran percepción de velocidad
✅ **Rate Limiting:** Previene spam en formularios
✅ **404 Page:** Página personalizada para rutas no encontradas

## Dominios Personalizados

### Conectar Dominio:

1. En Vercel Dashboard → Settings → Domains
2. Agrega tu dominio personalizado
3. Configura DNS según instrucciones de Vercel:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

## Monitoreo

### Vercel Analytics (Gratis)

En Vercel Dashboard → Analytics:
- Visitas por página
- Performance metrics
- Errores en tiempo real

### Google Analytics

Dashboard completo en:
- analytics.google.com
- Eventos personalizados ya configurados
- Tracking de conversiones

## Checklist de Deployment

- [ ] Variables de entorno configuradas en Vercel
- [ ] Google Analytics ID actualizado en index.html
- [ ] Google AdSense ID actualizado en index.html
- [ ] Dominio personalizado conectado (opcional)
- [ ] Prueba de funcionalidad en producción
- [ ] Política de privacidad visible
- [ ] Footer con contactos actualizado
- [ ] Sistema de tracking funcionando

## Build Local (Testing)

Antes de deploy, prueba el build localmente:

```bash
# Build de producción
npm run build

# Preview local
npm run preview

# Verifica en http://localhost:4173
```

## Troubleshooting

### Error: "VITE_SUPABASE_URL is not defined"
- Verifica variables de entorno en Vercel Dashboard
- Re-deploy después de agregar variables

### 404 en rutas
- Verifica que `vercel.json` esté en la raíz
- Debe incluir rewrites para SPA

### AdSense no aparece
- Espera 24-48 horas después de verificación
- Verifica que el código esté en `<head>`

## Soporte

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Vite Docs:** [vitejs.dev](https://vitejs.dev)
- **Contact:** [@joahan_morap](https://instagram.com/joahan_morap)

---

**¡Listo para producción! 🚀**
