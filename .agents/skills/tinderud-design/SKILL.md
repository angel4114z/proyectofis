---
name: tinderud-design
description: Guía cambios de interfaz de TinderUD con Material UI, el tema existente, accesibilidad y Motion. Úsala al diseñar pantallas, componentes o animaciones.
---

# TinderUD · Diseño

Lee `frontend/AGENTS.md` y el caso de uso aplicable en `docs/sourceTinderUD/informe_tinder_ud.tex`. Revisa las pantallas existentes y consulta `frontend/src/theme/theme.ts` y `frontend/src/providers/AppProviders.tsx` si están presentes en tu rama.

Usa componentes y valores del tema de Material UI para color, tipografía y espaciado. Extiende el tema cuando el cambio sea compartido. Sigue los patrones actuales de estilos locales y conserva la restricción sobre Tailwind CSS.

Comprueba navegación por teclado, foco, etiquetas y contraste en el flujo editado. Cuando haya gestos de reacción, conserva una acción equivalente mediante controles. Si usas Motion, respeta la preferencia de movimiento reducido.

En TinderUD, Material UI 9.5.0 y el tema existente definen los componentes y estilos. Las secciones externas sobre Tailwind CSS, shadcn/ui u otros sistemas de componentes quedan fuera del stack del proyecto.

Usa accessibility-audit para revisar los criterios WCAG 2.2 que el flujo pueda demostrar. Si una acción requiere arrastre, verifica también el [criterio 2.5.7](https://www.w3.org/TR/WCAG22/#dragging-movements) y comprueba la alternativa con un puntero sin arrastrar. La navegación por teclado y los estados de foco se comprueban con interacción o evidencia equivalente.
