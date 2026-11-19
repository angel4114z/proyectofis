---
name: tinderud-context
description: Ubica los requisitos académicos y el alcance implementado de TinderUD. Úsala al interpretar casos de uso o contrastar el informe con el MVP.
---

# TinderUD · Contexto

Desde la raíz del worktree, lee `AGENTS.md` y las secciones pertinentes de `docs/sourceTinderUD/informe_tinder_ud.tex`. Consulta `docs/sourceTinderUD/figuras/` para identificar actores, flujos y estados.

Comprueba el comportamiento actual en `frontend/src/`, `backend/app.py` y las pruebas. El MVP cubre acceso, perfiles, búsqueda, reacciones y matches. Verifica las capacidades adicionales del informe antes de contar con ellas. Para ejecutar el frontend, usa `frontend/package.json`.

Si una diferencia afecta una decisión importante, registra ambas referencias en `docs/memory/known-issues.md` y solicita aclaración.
