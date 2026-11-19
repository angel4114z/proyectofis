# Desarrollo multiagente de TinderUD

## Worktrees de Orca

1. Crea un worktree por tarea desde la rama acordada. Para una tarea independiente puedes usar `orca worktree create --name <tarea> --no-parent --json` desde el proyecto. Confirma la ruta con `orca worktree list --json`. Comprueba que la base incluya la configuración del proyecto.
2. Abre un terminal en la raíz del worktree e inicia `codex`, `kiro-cli --agent tinderud` o `agy`, según el CLI disponible. Ejecuta los comandos de la aplicación desde `frontend/`.
3. Asigna un objetivo, archivos de responsabilidad y verificaciones a cada agente. Revisa `git status --short` antes de editar. Si hay archivos o contratos comunes, acuerda el responsable y el orden de integración. Respeta los cambios ajenos y coordina cualquier solapamiento.
4. Revisa el diff de cada rama antes de integrarla. Registra la [entrega](memory/handoffs/README.md) en su propio archivo con referencias al trabajo.

Usa el navegador integrado de Orca para revisar la aplicación. Evita añadir un MCP de navegador que replique esa capacidad.

## Skills compartidas

Las siete definiciones están bajo `.agents/skills/`. Codex y Antigravity descubren esa ruta en el proyecto. Para comprobarlo, abre `/skills` en Codex o escribe `/tinderud-` en Antigravity para las skills propias.

Kiro descubre normalmente `.kiro/skills/`. Para usar las definiciones compartidas, ejecuta `kiro-cli chat --v3 --agent tinderud` desde la raíz y comprueba las sugerencias al escribir `/tinderud-`. El [perfil de TinderUD](../.kiro/agents/tinderud.json) declara una URI `skill://` por definición.

El 2026-11-10, Kiro CLI 3.2.0 con el perfil tinderud y Antigravity CLI 1.5.5 mostraron las cuatro skills en las sugerencias de comandos desde la raíz. Codex CLI 0.167.1 devolvió las cuatro mediante el método skills/list de su app-server.

Fuentes [Codex](https://learn.chatgpt.com/docs/build-skills), [Kiro](https://kiro.dev/docs/custom-agents/configuration-reference/) y [Antigravity](https://antigravity.google/docs/skills).

### Skills especializadas incorporadas el 2026-11-10

| Skill | Fuente fijada | Licencia |
| --- | --- | --- |
| [vercel-react-best-practices](../.agents/skills/vercel-react-best-practices/SKILL.md) | [vercel-labs/agent-skills · dc8367e6f91c022d83361f03c3313fa05e848ee5](https://github.com/vercel-labs/agent-skills/tree/dc8367e6f91c022d83361f03c3313fa05e848ee5/skills/react-best-practices) | MIT, declarada en el frontmatter original |
| [material-ui-nextjs](../.agents/skills/material-ui-nextjs/SKILL.md) | [mui/material-ui · v9.5.0](https://github.com/mui/material-ui/tree/v9.5.0/skills/material-ui-nextjs), commit 1c3f8b4903f21cfad12c102edb3db4ceba2e8c8c | MIT, con LICENSE del repositorio |
| [accessibility-audit](../.agents/skills/accessibility-audit/SKILL.md) | [humbleteam/accessibility-audit · 89529523877152fc40f118eb94d580b47d20ffb9](https://github.com/humbleteam/accessibility-audit/tree/89529523877152fc40f118eb94d580b47d20ffb9) | MIT, con LICENSE del repositorio |

Kiro referencia los siete archivos mediante una URI por skill. Para verificar el autocompletado en Kiro y Antigravity, busca también los prefijos `/vercel-`, `/material-ui-` y `/accessibility-`. Las convenciones de integración y auditoría aplicables a TinderUD están en las skills propias de arquitectura y diseño. Codex CLI 0.167.1 devolvió las siete skills locales mediante skills/list. Kiro CLI 3.2.0 y Antigravity CLI 1.5.5 mostraron las siete en el autocompletado.

## Context7

TinderUD usa el servidor oficial de Context7 en `https://mcp.context7.com/mcp` mediante Streamable HTTP. Las entradas del proyecto usan el acceso público y carecen de credenciales.

| CLI | Configuración efectiva del proyecto | Comprobación |
| --- | --- | --- |
| Codex | [`.codex/config.toml`](../.codex/config.toml) registra `mcp_servers.context7` con `url`. Codex carga la configuración de un proyecto de confianza. | Desde la raíz, `codex mcp list` muestra `context7` habilitado. |
| Kiro | [`.kiro/settings/mcp.json`](../.kiro/settings/mcp.json) registra `mcpServers.context7.url`. El [perfil tinderud](../.kiro/agents/tinderud.json) incluye esa configuración con `includeMcpJson: true`. | `kiro-cli mcp list` muestra `context7` bajo `tinderud`. En sesión V3, concede **Allow once** cuando la prueba de lectura lo requiera. |
| Antigravity | [`.agents/mcp_config.json`](../.agents/mcp_config.json) registra `mcpServers.context7.serverUrl`. | Consulta el estado en la sesión de Antigravity. En 1.5.5, el listado independiente devolvió vacío. Una sesión cargó el servidor local y completó las cuatro llamadas con permisos temporales para las dos herramientas de lectura. |

### Versiones consultadas el 2026-11-10

- **Next.js.** Instalado `16.4.6`, Context7 devolvió `/vercel/next.js/v16.4.5`. La guía de Server y Client Components incluida en `frontend/node_modules/next/dist/docs/` para 16.4.6 coincide en los puntos consultados. Los layouts y las páginas son Server Components por defecto y `'use client'` define el límite de módulos del cliente.
- **Material UI.** Instalado `9.5.0`, Context7 devolvió `/mui/material-ui/v9.2.0`. La guía oficial y la documentación incluida en 9.5.0 confirman `createTheme({ cssVariables: true })` con `ThemeProvider`. Las notas de 9.5.0 registran correcciones de `defaultProps` del tema y exportaciones, relevantes al revisar personalizaciones y tipos de esa versión.

Si Context7 no anuncia la versión exacta, identifica la versión devuelta y verifica los detalles que dependan de la instalada en su documentación local u oficial.

Fuentes [Context7](https://context7.com/docs/resources/all-clients), [MCP de Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [MCP de Kiro](https://kiro.dev/docs/mcp/configuration/), [MCP de Antigravity](https://antigravity.google/docs/mcp), [variables CSS de Material UI](https://mui.com/material-ui/customization/css-theme-variables/usage/) y [Material UI 9.5.0](https://github.com/mui/material-ui/releases/tag/v9.5.0).
