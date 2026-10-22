# Kenova Womenswear — Arquitectura Onion (TypeScript + Vite + Supabase + Vercel)

## Capas (las dependencias solo apuntan hacia adentro)
```
src/
  domain/           ← núcleo sin dependencias: entidades, reglas y puertos (interfaces)
  application/      ← casos de uso (solo usan el dominio)
  infrastructure/   ← implementaciones de los puertos con Supabase
  ui/               ← tienda y panel; solo conocen los casos de uso
  main.ts           ← raíz de composición: único lugar que conecta todo
supabase/schema.sql ← tablas, vista pública y seguridad (RLS)
```
Cambiar de Firebase a Supabase solo tocó `infrastructure/` y `main.ts`: dominio, aplicación y UI quedaron igual.

## 1. Supabase
1. En tu proyecto: SQL Editor → pega `supabase/schema.sql` (cambia `TU_CORREO@gmail.com` por tu correo) → Run.
2. Authentication → Users → Add user → tu correo y contraseña (marca "Auto Confirm User").
3. Project Settings → API: copia **Project URL** y la clave **anon public**.

> ⚠️ En el navegador NUNCA uses la cadena `postgresql://postgres:…` ni la contraseña de la base de datos, ni la clave `service_role`. Solo la URL y la `anon key`; la seguridad la hacen las reglas RLS del schema.

## 2. Local
```
npm install
cp .env.example .env     # pega tu anon key
npm run dev
```

## 3. Vercel
1. Sube el proyecto a GitHub (`.env` no se sube).
2. Vercel → Add New → Project → importa el repo (detecta Vite).
3. Settings → Environment Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` → Redeploy.

## Uso
- Tienda: `tu-sitio.vercel.app` · Panel: `tu-sitio.vercel.app/#admin` (sin enlaces públicos).
- Guarda primero tu WhatsApp en el panel (con código de país, sin +). Las fotos se eligen desde la galería y se guardan en Supabase Storage (bucket `product-images`).
- Costo, unidades y ventas están en la tabla `products`, solo legible por tu correo. El público lee la vista `catalog`, que no incluye esos datos.
- La tienda se refresca sola cada ~20 s; el panel, al instante tras cada cambio.
- Si en el panel ves todo en cero, el correo de `is_admin()` no coincide con el de tu usuario.
