# TinderUD · Fase 2: validación de la landing

**Fecha:** 2026-11-10  
**Build:** Next.js 16.4.6, React 19, Material UI 9.5.0  
**Revisión visual:** Antigravity; revisión técnica y validación final: Codex con coordinación Orca.

## Resultado

La landing pública y las pantallas informativas `/login` y `/register` están implementadas para revisión local. No se desplegó la aplicación ni se añadieron dependencias. El backend no se modificó. Los cambios funcionales de esta fase se limitaron a `frontend/`.

La landing se genera como contenido estático. El navbar y el selector de tema contienen las interacciones de cliente; la composición del Hero es estática. Se conservaron `AppRouterCacheProvider` para `v16-appRouter`, `InitColorSchemeScript` y los temas claro, oscuro y automático con preferencia persistente.

## Validaciones ejecutadas

Desde `frontend/`:

- `pnpm exec tsc --noEmit`: correcto.
- `pnpm exec eslint src`: correcto.
- `pnpm build`: correcto; se prerenderizaron `/`, `/login` y `/register`.

En Edge 157.0.4341.42 contra el build local:

- Reflow en 320, 768 y 1440 px con tema claro y oscuro; no hay overflow horizontal.
- Claro y oscuro persisten tras recarga. El modo automático sigue el cambio del esquema del sistema entre claro y oscuro.
- Movimiento reducido: activo y sin contenido decorativo oculto.
- Hidratación: consola limpia en la landing y las dos rutas informativas. El error React `#418` se resolvió al retirar el `<h3>` extra que duplicaba el encabezado que Material UI 9.5.0 genera en cada `Accordion`.
- FAQ: las seis regiones tienen `id` y `aria-labelledby` enlazados a su resumen; expandir el primer ítem actualiza `aria-expanded`.
- Teclado: el enlace de salto muestra foco de 2 px con 2 px de separación; el menú móvil abre y, al cerrar con Escape, el foco vuelve al botón que lo abrió.
- Borde de tarjetas en oscuro: contraste medido de 3.46:1 contra la superficie y 4.07:1 contra el fondo.
- Enlaces internos y rutas informativas: destino existente; `/login` y `/register` responden 200 y no tienen campos de entrada. Las etiquetas avisan que acceso y registro están en preparación.
- HTML: un H1, sin IDs duplicados, enlaces vacíos ni `href="#"`.

El registro detallado, incluidas las medidas por ancho y tema, está en [browser-checks.json](capturas/landing-fase-2/browser-checks.json).

## Capturas

Capturas de página completa producidas con el build final:

| Viewport | Claro | Oscuro |
| --- | --- | --- |
| Móvil · 320 px | [320-light.png](capturas/landing-fase-2/320-light.png) | [320-dark.png](capturas/landing-fase-2/320-dark.png) |
| Tableta · 768 px | [768-light.png](capturas/landing-fase-2/768-light.png) | [768-dark.png](capturas/landing-fase-2/768-dark.png) |
| Escritorio · 1440 px | [1440-light.png](capturas/landing-fase-2/1440-light.png) | [1440-dark.png](capturas/landing-fase-2/1440-dark.png) |

## Alcance y pendientes

- Las pantallas `/login` y `/register` son informativas: no capturan credenciales ni implementan autenticación.
- Los enlaces legales permanecen como texto “próximamente”; no se publicaron textos legales sin aprobación.
- No se realizó una auditoría con lector de pantalla ni una comprobación de zoom al 200 %. WCAG 2.2 AA sigue siendo el objetivo de diseño; estas pruebas automatizadas y visuales no representan una certificación completa.
- El servidor de producción local permanece disponible en `http://localhost:3000` para revisión visual. No se publicó ni desplegó.
- Los cambios anteriores en `frontend/package.json` y `frontend/pnpm-lock.yaml` ya existían antes de esta fase; no se instalaron ni actualizaron paquetes durante este trabajo.