# Problemas conocidos

## 2026-11-10 · Arranque del frontend desactualizado en el README

El README raíz describe un servidor estático. El manifiesto del frontend declara Next.js y un script `dev`. Para ejecutar el frontend actual, consulta el manifiesto y las instrucciones de Next.js.

Referencias [README raíz](../../README.md), [manifiesto](../../frontend/package.json) e [instrucciones de Next.js](../../frontend/AGENTS.md).

## 2026-11-10 · Diferencia entre el alcance académico y el MVP

El informe contempla comunicación y protección. El backend actual expone acceso, perfiles, búsqueda, reacciones y matches. Si una tarea depende de otra capacidad, comprueba el contrato y aclara el alcance antes de implementarla.

Referencias [informe académico](../sourceTinderUD/informe_tinder_ud.tex) y [API FastAPI](../../backend/app.py).

## 2026-11-10 · Validación de Context7 desde los CLI

Antigravity CLI 1.5.5 ejecutado desde la raíz devuelve `No MCP servers configured` en `agy mcp list` con la entrada de proyecto presente. La sesión intentó llamar a Context7, pero el modo no interactivo denegó el permiso MCP porque no puede solicitarlo. La prueba no interactiva pasó al iniciar una sesión con permisos temporales limitados a resolve-library-id y query-docs de Context7. Las cuatro llamadas devolvieron resultados. El listado independiente sigue vacío.

Kiro CLI 3.2.0 muestra Context7 en el perfil `tinderud`. La ejecución V3 no interactiva detectó `@context7/resolve-library-id` pero canceló su solicitud de permiso porque ese modo no puede resolverla. La comprobación interactiva pasó con permisos de una sola vez para las cuatro llamadas.

Referencias [configuración de Antigravity](../../.agents/mcp_config.json), [perfil de Kiro](../../.kiro/agents/tinderud.json) y [guía multiagente](../multiagent.md).


## 2026-11-10 · Validación complementaria de accesibilidad de la landing

La implementación y pruebas de Fase 2 pasan build, consola de hidratación, navegación de teclado, reflow, temas, rutas y contraste de borde oscuro. Quedan fuera de las pruebas ejecutadas una auditoría con lector de pantalla y la comprobación de zoom al 200 %; completar antes de una auditoría de accesibilidad integral.

Referencias [resultado final](../landing-fase-2-validacion.md) e [informe visual](../landing-fase-2-revision.md).