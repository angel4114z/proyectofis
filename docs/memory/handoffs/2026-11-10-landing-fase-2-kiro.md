# 2026-11-10 · Entrega: Landing pública Fase 2 (Kiro, frontend)

## Contexto y alcance

Implementación de la landing pública aprobada en [docs/landing-fase-1.md](../../landing-fase-1.md).
Kiro como único editor del frontend. Alcance: `frontend/src` y archivos estrictamente
necesarios del frontend, sin tocar `package.json` ni el lockfile.

## Cambios

- `frontend/src/theme/theme.ts`: tema con `cssVariables.colorSchemeSelector: "class"`,
  `colorSchemes.light/dark` y los tokens exactos de la propuesta (vinotinto/azul/dorado).
  Tipografía única con fallback de sistema (Inter como primera opción, sin descarga en build).
  H1 fluido 36→68 px, interlineado 1.06; cuerpo 16–18 px / 1.55; radios 16–20 px; botones ≥44 px.
- `frontend/src/providers/AppProviders.tsx`: conserva `AppRouterCacheProvider` de
  `@mui/material-nextjs/v16-appRouter`, `ThemeProvider defaultMode="system"`, `CssBaseline`,
  `QueryClientProvider` y `MotionConfig reducedMotion="user"`.
- `frontend/src/app/layout.tsx`: `InitColorSchemeScript attribute="class" defaultMode="system"`
  como primer hijo de `<body>`; `suppressHydrationWarning` solo en `<html>`; metadata + viewport.
- `frontend/src/app/globals.css`: retira la duplicación de fondo/texto/`color-scheme` (los gobierna
  MUI) y el `overflow-x: hidden` global; conserva resets estructurales; añade `.content-link` con
  subrayado para enlaces en texto.
- `frontend/src/app/page.tsx`: página **Server Component** con las ocho secciones.
- `frontend/src/features/landing/`: contenido serializable (`content.ts`), secciones servidor
  (Hero, Modes, HowItWorks, Community, Faq, CtaFinal, Footer) e islas cliente
  (Navbar con menú y selector de tema, ThemeModeSelect, HeroComposition estática, FaqAccordion,
  PrepLinkButton, PrepScreen, SkipLink).
- `frontend/src/app/login/page.tsx` y `frontend/src/app/register/page.tsx`: rutas informativas
  temporales sin captura de credenciales, con estado "Acceso/Registro en preparación".
- `frontend/src/components/ui/NextLink.tsx`: envoltorio cliente de `next/link` para `component` de MUI.
- Eliminado el scaffold `frontend/src/app/page.module.css` (fuentes geist, ya sin uso).

## Decisiones

- **Inter**: no hay fuente local disponible y `next/font/google` requiere descarga en build.
  Para no comprometer el build (sandbox/offline), se usa pila de sistema con Inter como primera
  opción. Si se autoriza una fuente local, enlazarla en `theme.ts` y, de usar `next/font`, verificar
  la disponibilidad en build.
- **MUI 9.5.0 — `Stack`**: `StackOwnProps` ya no acepta `alignItems`/`justifyContent` como props;
  se mueven a `sx`. `Drawer` usa `slotProps={{ paper }}` en lugar de `PaperProps`.
- **Frontera servidor/cliente (Next.js 16)**: los callbacks de `sx` (funciones) no cruzan a
  Server Components. `SkipLink` (servidor) usa `sx` estático; los estilos dependientes del esquema
  usan `theme.applyStyles("dark", …)` en islas cliente.
- **Enlaces legales**: Términos y Privacidad se muestran como texto "(próximamente)", sin `href` vacío.

## Verificaciones (desde `frontend/`)

- `npx tsc --noEmit` → OK.
- `npx eslint src` → OK (sin avisos).
- `npx next build` → OK. `/`, `/login`, `/register` prerenderizadas como estáticas.
- No se ejecutó `next dev` junto al build. La landing no emite solicitudes de autenticación.

## Estado final y verificaciones (2026-11-10)

Se corrigieron los hallazgos de revisión: el acordeón usa el `<h3>` que genera MUI 9, el navbar comparte markup entre SSR y cliente, el borde de tarjetas usa la variable de divisor activa y el enlace CTA alcanza 24 px de altura.

En el build final, `pnpm exec tsc --noEmit`, `pnpm exec eslint src` y `pnpm build` pasan. Edge 157 reporta consola limpia, FAQ con seis regiones ARIA enlazadas, foco de teclado visible, menú móvil que devuelve el foco al abrir/cerrar con Escape, preferencia de tema persistente y modo automático, movimiento reducido, destinos existentes y sin overflow a 320/768/1440 px. Contraste del borde oscuro: 3.46:1 sobre superficie y 4.07:1 sobre fondo. Las seis capturas finales y el registro automatizado están en `docs/capturas/landing-fase-2/`.

No se modificaron backend, dependencias ni configuraciones globales. Las rutas de acceso/registro siguen siendo informativas y no capturan credenciales. Pendientes de auditoría complementaria: lector de pantalla y zoom al 200 %; textos legales definitivos siguen pendientes de aprobación.
Referencias: [propuesta](../../landing-fase-1.md), [tema](../../../frontend/src/theme/theme.ts),
[providers](../../../frontend/src/providers/AppProviders.tsx), [page](../../../frontend/src/app/page.tsx).
