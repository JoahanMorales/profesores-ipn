# 📊 Database Schema - Profesores IPN

Este directorio contiene el schema completo de la base de datos Supabase.

## 📁 Estructura

```
database/
├── schema.sql          # Schema completo de todas las tablas
├── policies.sql        # Políticas de Row Level Security (RLS)
├── functions.sql       # Edge Functions y stored procedures
└── README.md          # Este archivo
```

## 🗄️ Tablas principales

| Tabla | Descripción | Relaciones |
|-------|-------------|-----------|
| **escuelas** | Escuelas del IPN (ESCOM, UPIICSA, etc.) | → carreras |
| **carreras** | Carreras por escuela | ← escuelas, → evaluaciones |
| **profesores** | Información de profesores | → evaluaciones |
| **usuarios** | Usuarios anónimos del sistema | → evaluaciones, → reportes |
| **evaluaciones** | Opiniones sobre profesores | ← profesores, ← usuarios, ← escuelas, ← carreras |
| **reportes** | Sistema de reportes de contenido | ← evaluaciones, ← usuarios |

## 🔄 Cómo sincronizar cambios

### Descargar cambios desde Supabase:
```bash
supabase db pull
```

### Subir cambios locales a Supabase:
```bash
supabase db push
```

### Ver diferencias:
```bash
supabase db diff
```

## 🔐 Políticas RLS

Las políticas de Row Level Security están en `policies.sql`. Estas controlan:
- Quién puede leer/escribir en cada tabla
- Validaciones a nivel de base de datos
- Seguridad de datos sensibles

## 📝 Convenciones

- Todos los IDs son `uuid` con `gen_random_uuid()`
- Todas las tablas tienen `created_at timestamp with time zone`
- Los nombres de tablas están en plural
- Las constraints tienen nombres descriptivos

## 🚨 Importante

**NUNCA ejecutes `schema.sql` directamente en producción.**  
Este archivo es solo para referencia. Usa migraciones controladas con Supabase CLI.

## 📌 Changelog

### 2026-02-05
- ✅ Schema inicial exportado
- ✅ 6 tablas principales documentadas
- 🔄 Pendiente: Exportar policies RLS
- 🔄 Pendiente: Exportar functions/triggers
