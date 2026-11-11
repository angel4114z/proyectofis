# TinderUD

- Consulta la documentación pertinente antes de implementar. El [informe y los diagramas académicos](docs/sourceTinderUD/informe_tinder_ud.tex) bajo `docs/` describen los requisitos. El código y sus pruebas representan el estado de implementación.
- Registra las contradicciones con ambas referencias en [problemas conocidos](docs/memory/known-issues.md). Pide aclaración antes de tomar una decisión importante de alcance, comportamiento o contrato.
- Trabaja principalmente en `frontend/`. Sigue [sus instrucciones de Next.js](frontend/AGENTS.md) y consulta la documentación local que indican. Comprueba scripts y versiones en el [manifiesto](frontend/package.json) y el lockfile.
- Usa Next.js App Router, React y TypeScript. Reutiliza el tema y los providers de Material UI. Usa TanStack Query para datos remotos, Zustand para estado cliente compartido cuando haga falta, React Hook Form con Zod para formularios y Motion para animaciones. No introduzcas Tailwind CSS.
- Respeta el alcance asignado y los cambios de otros agentes. Conserva configuraciones y skills existentes. Pide autorización para instalaciones, cambios globales y operaciones destructivas.
- Sigue la [guía multiagente](docs/multiagent.md) para coordinar worktrees y consultar el estado de MCP. Mantén la [memoria compartida](docs/memory/README.md) libre de información sensible.
