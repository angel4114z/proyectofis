# Decisiones confirmadas

## 2026-11-10 · Requisitos e implementación

El informe bajo `docs/` describe los requisitos académicos. El código y sus pruebas representan la implementación actual. Las divergencias se registran y requieren aclaración cuando afectan decisiones importantes.

Referencias [informe académico](../sourceTinderUD/informe_tinder_ud.tex) e [instrucciones compartidas](../../AGENTS.md).

## 2026-11-10 · Skills y memoria en el repositorio

TinderUD mantiene una copia de las cuatro skills en `.agents/skills/` y memoria compartida en Markdown. El perfil de Kiro referencia esas definiciones mediante `skill://`. La integración de MCP requiere autorización posterior.

Referencias [guía multiagente](../multiagent.md) y [perfil de Kiro](../../.kiro/agents/tinderud.json).

## 2026-11-10 · Primera ronda de skills especializadas

Para complementar las instrucciones de TinderUD, se incorporaron vercel-react-best-practices desde vercel-labs/agent-skills en `dc8367e6f91c022d83361f03c3313fa05e848ee5`, material-ui-nextjs desde mui/material-ui en `v9.5.0` y accessibility-audit desde humbleteam/accessibility-audit en `89529523877152fc40f118eb94d580b47d20ffb9`. Las fuentes se conservan sin cambios en una copia común a los tres CLI.

Referencias [guía multiagente](../multiagent.md#skills-especializadas-incorporadas-el-2026-11-10) y [perfil de Kiro](../../.kiro/agents/tinderud.json).

## 2026-11-10 · Semántica del acordeón y tema MUI 9.5.0

`Accordion` genera su encabezado semántico `<h3>` y deriva el `id` de región desde el `id` y `aria-controls` de `AccordionSummary`. El resumen debe ser su primer hijo directo; envolverlo en otro heading produce HTML anidado inválido y fallo React #418 durante hidratación. Los bordes de tarjeta usan `var(--mui-palette-divider)` para respetar el esquema activo. El divisor oscuro `rgba(247, 248, 252, 0.4)` mide 3.46:1 sobre la superficie y 4.07:1 sobre el fondo.

Referencias [implementación FAQ](../../frontend/src/features/landing/components/FaqAccordion.tsx), [tema](../../frontend/src/theme/theme.ts) y [validación final](../landing-fase-2-validacion.md).