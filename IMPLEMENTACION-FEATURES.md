# 🚀 INSTRUCCIONES DE IMPLEMENTACIÓN

## 📋 TODO List Completado

✅ Sistema de reportes completo
✅ Panel de administración
✅ Detección de duplicados con búsqueda fuzzy
✅ Badge de verificado (3+ evaluaciones)
✅ Paginación en búsqueda
✅ Botón de reportar en evaluaciones

---

## 🗄️ PASO 1: Aplicar Script SQL a Supabase

### Opción A: Editor SQL de Supabase (Recomendado)
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto: `profesores-ipn`
3. Click en "SQL Editor" en el menú izquierdo
4. Click en "+ New query"
5. Copia y pega TODO el contenido de: `dev-docs/add-reportes-system.sql`
6. Click en "Run" (▶️)
7. Verifica que se ejecutó sin errores

### Opción B: psql (Terminal)
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f dev-docs/add-reportes-system.sql
```

### ⚠️ IMPORTANTE: Configurar Email de Admin

Después de ejecutar el script, **DEBES** actualizar la policy con tu email:

1. En el SQL Editor, ejecuta:
```sql
-- Reemplaza 'tu-email@ejemplo.com' con tu email real
DROP POLICY IF EXISTS "Admin puede actualizar reportes" ON reportes;

CREATE POLICY "Admin puede actualizar reportes" ON reportes
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'email' = 'TU-EMAIL-REAL@GMAIL.COM'  -- ⚠️ CAMBIA ESTO
  );
```

2. También actualiza en el código:
- Abre: `src/components/AdminPanel.jsx`
- Línea 11: Cambia `'tu-email@ejemplo.com'` por tu email real
```javascript
const ADMIN_EMAIL = 'tu-email-real@gmail.com'; // ⚠️ CAMBIA ESTO
```

---

## 🔧 PASO 2: Verificar Instalación

### Verificar en Supabase:

1. **Tabla `reportes` creada:**
   - SQL Editor → Ejecuta: `SELECT * FROM reportes LIMIT 1;`
   - Debe retornar 0 rows (vacío pero sin error)

2. **Columna `oculto` en evaluaciones:**
   - SQL Editor → Ejecuta: `SELECT id, oculto FROM evaluaciones LIMIT 1;`
   - Debe mostrar columna `oculto` con valores `false`

3. **Columna `nombre_normalizado` en profesores:**
   - SQL Editor → Ejecuta: `SELECT nombre_completo, nombre_normalizado FROM profesores LIMIT 5;`
   - Debe mostrar nombres normalizados (sin tildes, minúsculas)

4. **Función `buscar_duplicados_profesores` existe:**
   - SQL Editor → Ejecuta: 
   ```sql
   SELECT buscar_duplicados_profesores('Juan Perez');
   ```
   - Debe retornar profesores similares

---

## 📦 PASO 3: Instalar Dependencias (Si Necesario)

El código usa solo librerías ya instaladas, pero verifica:

```bash
npm install
```

---

## 🧪 PASO 4: Probar Funcionalidades

### 1. Probar Búsqueda de Duplicados
1. Ve a `/evaluar`
2. Escribe nombre de profesor existente con errores: "juan peres" (si existe "Juan Pérez")
3. Debe aparecer alerta amarilla con sugerencias

### 2. Probar Badge de Verificado
1. Ve a `/buscar`
2. Profesores con 3+ evaluaciones deben tener bolita morada con ✓

### 3. Probar Reportar Evaluación
1. Ve a cualquier perfil de profesor con evaluaciones
2. Click en icono de bandera (🚩) en esquina de evaluación
3. Llena formulario y envía
4. Verifica en Supabase: `SELECT * FROM reportes;`

### 4. Probar Panel Admin
1. Inicia sesión con tu email de admin
2. Ve a `/admin` (o manualmente: `http://localhost:5173/admin`)
3. Si tu email NO coincide → verás "Acceso Denegado"
4. Si coincide → verás panel con reportes
5. Prueba botones: Ocultar, Eliminar, Marcar Revisado

### 5. Probar Paginación
1. Ve a `/buscar`
2. Si hay más de 20 profesores, verás botón "Cargar más"
3. Click en botón debe cargar siguientes 20

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "function buscar_duplicados_profesores does not exist"
**Solución:** El script SQL no se ejecutó completamente. Re-ejecuta desde SQL Editor.

### Error: "relation reportes does not exist"
**Solución:** La tabla no se creó. Ejecuta manualmente:
```sql
CREATE TABLE reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluacion_id UUID NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_reporte TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Error: "column oculto does not exist"
**Solución:** Ejecuta:
```sql
ALTER TABLE evaluaciones ADD COLUMN oculto BOOLEAN DEFAULT FALSE;
```

### Error: "extension pg_trgm does not exist"
**Solución:** Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Panel Admin muestra "Acceso Denegado"
**Solución:** 
1. Verifica que iniciaste sesión con el email correcto
2. Verifica que actualizaste `ADMIN_EMAIL` en `AdminPanel.jsx`
3. Verifica que actualizaste la policy en Supabase

---

## 📝 ARCHIVOS MODIFICADOS

### Nuevos Archivos:
- ✅ `dev-docs/add-reportes-system.sql` - Script SQL completo
- ✅ `src/services/adminService.js` - Servicios de admin
- ✅ `src/components/AdminPanel.jsx` - Panel de administración
- ✅ `src/components/DisclaimerBanner.jsx` - Banner de disclaimer
- ✅ `src/components/TermsOfService.jsx` - Términos de servicio
- ✅ `src/components/ReportPage.jsx` - Página de reportes pública

### Archivos Modificados:
- ✅ `src/components/ProfesorProfile.jsx` - Botón reportar + badge verificado
- ✅ `src/components/SearchPage.jsx` - Paginación + badge verificado
- ✅ `src/components/EvaluationForm.jsx` - Detección de duplicados
- ✅ `src/components/LandingPage.jsx` - Banner de disclaimer
- ✅ `src/components/Footer.jsx` - Links legales + disclaimer
- ✅ `src/components/PrivacyPolicy.jsx` - Convertido a página completa
- ✅ `src/App.jsx` - Rutas de admin, términos, privacidad, reportar

---

## 🎯 FEATURES IMPLEMENTADAS

### 1. Sistema de Reportes
- [x] Tabla `reportes` en Supabase
- [x] Botón reportar en cada evaluación
- [x] Modal de reporte con categorías
- [x] Almacenamiento en base de datos
- [x] Panel admin para gestionar

### 2. Panel de Administración (`/admin`)
- [x] Verificación de acceso por email
- [x] Lista de reportes con filtros (pendiente/revisado/rechazado)
- [x] Botones: Ocultar, Eliminar, Marcar Revisado
- [x] Vista detallada de cada reporte

### 3. Detección de Duplicados
- [x] Normalización automática de nombres (lowercase, sin tildes)
- [x] Función `normalizar_nombre()` en PostgreSQL
- [x] Búsqueda fuzzy con pg_trgm
- [x] Alerta visual en formulario de evaluación
- [x] Sugerencias de profesores similares

### 4. Badge de Verificado
- [x] Bolita morada con ✓ para profesores con 3+ evaluaciones
- [x] Animación de pulso
- [x] Visible en tarjetas de búsqueda
- [x] Visible en perfil de profesor

### 5. Paginación
- [x] Carga inicial de 20 resultados
- [x] Botón "Cargar más" para siguientes páginas
- [x] Indicador de carga
- [x] Mensaje de fin de resultados

---

## 🔐 SEGURIDAD

### RLS Policies Aplicadas:
- ✅ Usuarios autenticados pueden crear reportes
- ✅ Usuarios pueden ver sus propios reportes
- ✅ Solo admin (tu email) puede actualizar reportes
- ✅ Evaluaciones ocultas siguen en DB pero no se muestran

### Protección Anti-Spam:
- ⚠️ **PENDIENTE:** Implementar rate limiting para reportes (max 5 por día)
- ⚠️ **PENDIENTE:** Implementar rate limiting para evaluaciones (ya tienes esto?)

---

## 🚀 DEPLOY A VERCEL

Después de verificar que todo funciona localmente:

```bash
# 1. Commit de cambios
git add .
git commit -m "feat: sistema de reportes, admin panel, duplicados, badges y paginación"

# 2. Push
git push origin main

# 3. Vercel desplegará automáticamente
```

Verifica en Vercel que:
- No hay errores de build
- Variables de entorno de Supabase están configuradas
- La app funciona en producción

---

## ✅ CHECKLIST FINAL

Antes de considerar la app lista:

- [ ] Script SQL ejecutado sin errores
- [ ] Email de admin configurado en AdminPanel.jsx
- [ ] Email de admin configurado en policy de Supabase
- [ ] Probado reportar evaluación
- [ ] Probado panel admin
- [ ] Probado detección de duplicados
- [ ] Probado badge de verificado
- [ ] Probado paginación
- [ ] Commit y push a Git
- [ ] Desplegado en Vercel
- [ ] Probado en producción

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisa errores en consola del navegador (F12)
2. Revisa errores en terminal de Vite
3. Verifica logs de Supabase
4. Verifica que el script SQL se ejecutó completamente

---

## 🎉 ¡LISTO!

Tu app ahora tiene:
✅ Sistema de moderación completo
✅ Protección contra duplicados
✅ Badges de verificación
✅ Paginación eficiente
✅ Panel de administración profesional

**¡Felicidades! Tu plataforma está lista para usuarios reales.** 🚀
