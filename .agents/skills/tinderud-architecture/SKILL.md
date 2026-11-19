---
name: tinderud-architecture
description: Orienta cambios de TinderUD en App Router, estado, formularios y contratos FastAPI. Úsala al cambiar límites de cliente y servidor o integrar la API.
---

# TinderUD · Arquitectura

Lee `AGENTS.md`, `frontend/AGENTS.md` y la guía local de Next.js aplicable. Confirma versiones en el manifiesto y el lockfile. Usa componentes de servidor cuando su comportamiento lo permita y limita los componentes cliente a los puntos que requieren hooks, eventos o providers. Revisa el layout y los providers de la rama antes de añadir inicializaciones.

Usa TanStack Query para datos remotos, Zustand para estado cliente compartido que lo requiera y React Hook Form con Zod para formularios. Conserva una fuente de estado por responsabilidad.

Verifica rutas, esquemas, autenticación y errores en `backend/app.py`, `backend/core/` y las pruebas. El almacenamiento actual es temporal. Registra divergencias con el informe y aclara cambios importantes de contrato.

Para rendimiento con Next.js 16.4.6 y React 19, consulta vercel-react-best-practices. Aplica sus principios de caché y deduplicación con TanStack Query, la biblioteca de consultas del proyecto. Los ejemplos con SWR y better-all son referencias de técnica y no autorizan dependencias nuevas.

Para SSR, streaming y Emotion con Material UI 9.5.0, consulta material-ui-nextjs. En el App Router de TinderUD, conserva AppRouterCacheProvider desde `@mui/material-nextjs/v16-appRouter`. Usa la documentación local de Next.js y los providers de la rama para verificar los ejemplos de otras versiones.
