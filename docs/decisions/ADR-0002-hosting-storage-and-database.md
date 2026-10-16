# ADR-0002 — Hosting web, base de datos y almacenamiento de archivos

Fecha: 2026-10-16. Estado: aceptado para el alcance descrito.

## Contexto

Moon es un monorepo con una aplicación Angular (`apps/web`) y una API NestJS
(`apps/api`). La aplicación ya utiliza Mongoose y tiene configurada la conexión
a MongoDB. La selección de imágenes de eventos actual solo genera una vista
previa local: todavía no existe un flujo de subida ni persistencia de archivos.

Se requiere definir los proveedores de infraestructura para el frontend, la
base de datos y los archivos, sin inferir que los servicios estén ya
configurados o desplegados.

## Opciones consideradas

- Hosting estático para Angular en Vercel, u otro proveedor de frontend.
- MongoDB Atlas u otra base de datos/servicio administrado compatible con
  Mongoose.
- Cloudflare R2 u otro almacenamiento de objetos para imágenes y archivos.

## Decisión [C]

- El frontend Angular se desplegará en **Vercel**.
- La base de datos será **MongoDB Atlas**, mediante **Mongoose**, con la base
  `moon1`.
- Los archivos de la aplicación se almacenarán en un bucket de **Cloudflare
  R2**.

La API NestJS no se despliega automáticamente como parte de esta decisión; su
hosting sigue por definir. La integración con Atlas existente no autoriza
exponer su URI ni sus credenciales en el frontend o en documentación.

## Consecuencias y límites

- Vercel debe construir y servir únicamente `apps/web`. Las variables públicas
  del frontend no pueden contener secretos; la URL pública de la API, cuando
  exista, deberá configurarse por entorno.
- Las credenciales de MongoDB Atlas y de Cloudflare R2 permanecen solo en la
  configuración segura del backend o del proveedor que opere la API. No se
  incluyen en el repositorio, bundles del navegador ni logs.
- R2 es privado y solo la API accede a él. El navegador no recibe credenciales
  del bucket ni permisos amplios de escritura; las lecturas actuales se sirven
  mediante una ruta autenticada de la API.
- La portada del borrador acepta JPG, PNG o WebP de máximo 8 MB. La API valida
  la firma binaria, usa claves opacas bajo `events/<eventId>/` y elimina el
  objeto reemplazado o retirado. Aún se deben definir CORS del bucket para
  cualquier futuro acceso directo, entrega por CDN/URLs firmadas y soporte de
  varias imágenes públicas.
- Elegir Vercel no decide todavía si Angular se sirve como SPA, con prerender o
  con SSR, ni resuelve los dominios, CORS, despliegue de la API u observabilidad
  de producción.

## Fecha

2026-10-16
