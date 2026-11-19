# TinderUD · Informe de Revisión Visual y Accesibilidad (Fase 2)

**Fecha:** 2026-11-10  
**Evaluador:** Agente Antigravity (Revisión Visual Autorizada)  
**Entorno evaluado:** Servidor local Next.js en producción (`http://localhost:3000`), navegadores Orca Browser y Microsoft Edge headless.  
**Capturas generadas:** `docs/capturas/landing-fase-2/` (`1440-light.png`, `1440-dark.png`, `768-light.png`, `768-dark.png`, `320-light.png`, `320-dark.png`).

---

## Resumen Ejecutivo

Se ejecutó la revisión visual y técnica completa de la landing pública de TinderUD en los tres viewports solicitados (320 px móvil, 768 px tableta, 1440 px escritorio) en esquemas claro y oscuro mediante el selector real de apariencia. Se verificaron la jerarquía visual, la igualdad de los tres modos, los contrastes de color, la ausencia de desplazamiento horizontal, el comportamiento de las islas interactivas (menú y acordeón FAQ) y la honestidad del copy frente al alcance actual.

---

## Hallazgos por Severidad

### P0 - Bloqueos de uso
*Ninguno.* La página es plenamente operable por teclado y navegación visual, no presenta trampas de foco, bloqueos de contenido ni elementos inaccesibles críticos.

---

### P1 - Degrada el uso

1. **Error de hidratación en consola (React Error #418)**
   - **Observado:** En consola se registra `Minified React error #418` al cargar la página por primera vez. Esto ocurre durante la hidratación de componentes cliente (particularmente en `ThemeModeSelect.tsx` donde el estado inicial de `mode` en SSR es `undefined` y difiere del primer render cliente, o por identificadores dinámicos generados por `Tooltip` entre cliente y servidor).
   - **Corrección:** Aplicar un patrón de montaje controlado (`const [mounted, setMounted] = useState(false)` con `useEffect`) en `ThemeModeSelect` para garantizar paridad estricta entre el HTML del servidor y el primer pase de hidratación en cliente.
   - **Criterio / Norma:** Integridad de hidratación React 19 / WCAG 2.2 SC 4.1.2 (*Name, Role, Value*, Nivel A).

2. **Doble encabezado H3 en acordeón de Preguntas Frecuentes (Bundle previo)**
   - **Observado:** En la compilación en ejecución en el servidor local, el componente `FaqAccordion` presentaba un `Box component="h3"` envolviendo el botón `AccordionSummary`, y en su interior otro elemento `<h3>` en lugar de un `span`, generando la estructura no estándar `<h3><button><span><h3>...</h3></span></button></h3>`. Kiro preparó la corrección en código fuente (`Typography component="span"` e IDs vinculados `faq-*-header` / `faq-*-content`); se requiere recompilar (`pnpm build`) y reiniciar el servidor local para que impacte el bundle activo.
   - **Corrección:** Recompilar el bundle de producción para asegurar que el resumen del acordeón contenga únicamente un `span` de texto dentro del botón envuelto por el único `<h3>`.
   - **Criterio:** WCAG 2.2 SC 1.3.1 (*Info and Relationships*, Nivel A) y SC 4.1.2 (*Name, Role, Value*, Nivel A).

---

### P2 - Fricción y refinamiento visual

1. **Contraste del borde de tarjetas en Modo Oscuro (`MuiCard`)**
   - **Observado:** En `frontend/src/theme/theme.ts`, `MuiCard.styleOverrides.root` interpola ``border: `1px solid ${theme.palette.divider}` ``, lo que evalúa a la cadena estática de claro `rgba(23, 27, 44, 0.12)` en lugar de la variable CSS dinámica `var(--mui-palette-divider)`. En modo oscuro, esto genera un borde casi invisible sobre la superficie `#222840`.
   - **Corrección:** Reemplazar por `borderColor: 'divider'` o `border: '1px solid var(--mui-palette-divider)'` en la configuración del tema.
   - **Criterio:** WCAG 2.2 SC 1.4.11 (*Non-text Contrast*, Nivel AA).

2. **Área táctil de enlace secundario en CTA final**
   - **Observado:** El enlace inline `Iniciar sesión` en la sección final tiene una altura de caja de 20 px (`85.1 × 20 px`). Aunque los enlaces en texto continuo cuentan con excepción bajo WCAG 2.2 SC 2.5.8, en pantallas táctiles de 320 px una altura de 20 px dificulta la pulsación precisa.
   - **Corrección:** Agregar holgura vertical mínima (`py: 0.5`, `display: 'inline-block'`) para alcanzar un área efectiva de al menos 24 × 24 CSS px.
   - **Criterio:** WCAG 2.2 SC 2.5.8 (*Target Size (Minimum)*, Nivel AA).

---

## Verificación de Criterios y Especificaciones

| Requisito / Criterio | Estado | Evidencia y Mediciones |
|---|---|---|
| **Ausencia de Overflow Horizontal (Reflow 320 px)** | **Pasa** | En 320 px móvil, `scrollWidth` = 320 px y 305 px sin margen de desbordamiento horizontal. Tampoco hay overflow en 768 px (`scrollWidth` = 753 px) ni en 1440 px (`scrollWidth` = 1425 px). |
| **Jerarquía e Igualdad de los Tres Modos** | **Pasa** | Sección `Modos` presenta tres tarjetas exactamente iguales (Citas, Amistades, Networking) en rejilla de 3 columnas (`repeat(3, 1fr)`) en escritorio y apiladas en móvil, sin modo destacado ni CTAs individuales. |
| **Paleta y Contraste de Colores** | **Pasa** | Cumple con la tabla de tokens de `landing-fase-1.md`: Claro (`#F7F8FC` fondo, `#FFFFFF` superficie, `#851D35` acción principal); Oscuro (`#171B2C` fondo, `#222840` superficie, `#FFB7C6` acción principal). Acento dorado `#F0B94D` con texto `#171B2C` (ratio 9.56:1, superior a 4.5:1). |
| **Interacción del Selector de Apariencia** | **Pasa** | El grupo de botones Claro, Oscuro y Automático conmuta la clase en `<html>` de manera inmediata y persiste la selección tras recarga. |
| **Interacción del Menú Móvil** | **Pasa** | El botón de menú en 320 px abre el `Drawer` con diálogo accesible y lista de navegación completa; al pulsar "Cerrar menú" o una ancla, el foco retorna ordenadamente al botón disparador. |
| **Interacción de Preguntas Frecuentes (FAQ)** | **Pasa** | Acordeón expande y colapsa correctamente por clic y teclado (Enter/Espacio), alternando `aria-expanded` y mostrando el contenido descriptivo. |
| **Copy Honesto y Legales Pendientes** | **Pasa** | Textos verificados: no hay promesas engañosas de acreditación universitaria; aviso explícito para mayores de 18 años; aviso de proyecto independiente visible en Hero y Footer; enlaces legales (Términos, Privacidad) mostrados como texto con `(próximamente)` sin enlaces rotos ni `href="#"` vacíos. |
| **Rutas Informativas de Autenticación** | **Pasa** | Los enlaces a `/login` y `/register` cuentan con etiquetas informativas claras ("Acceso en preparación", "Registro en preparación"), asociadas con `aria-describedby`, sin formularios ni captura engañosa de credenciales. |

---

## Registro de Capturas

Las capturas de página completa están preservadas en `docs/capturas/landing-fase-2/`:
- `1440-light.png`: Vista completa de escritorio (1440 px) en esquema claro.
- `1440-dark.png`: Vista completa de escritorio (1440 px) en esquema oscuro.
- `768-light.png`: Vista completa de tableta (768 px) en esquema claro.
- `768-dark.png`: Vista completa de tableta (768 px) en esquema oscuro.
- `320-light.png`: Vista completa de móvil (320 px) en esquema claro.
- `320-dark.png`: Vista completa de móvil (320 px) en esquema oscuro.
- `browser-checks.json`: Registro automatizado de validaciones del navegador.

## Actualización del coordinador · validación final

El bundle inicial inspeccionado durante la revisión contenía un heading duplicado y React #418. La causa se confirmó en MUI 9.5.0: `Accordion` ya genera su propio `<h3>`. Se retiró el wrapper redundante y el build final quedó sin errores de consola; las seis regiones FAQ conservan sus vínculos ARIA. El borde oscuro ahora alcanza 3.46:1 frente a la superficie y 4.07:1 frente al fondo; el enlace de CTA tiene altura mínima de 24 px. Resultados reproducibles y limitaciones en [validación Fase 2](landing-fase-2-validacion.md).