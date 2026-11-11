# TinderUD · Propuesta de landing pública

**Conecta más allá del aula.** TinderUD se propone como una plataforma independiente para estudiantes de la Universidad Distrital Francisco José de Caldas, de 18 años o más. Esta fase define la experiencia pública y su arquitectura. El MVP existente ofrece login, perfiles, reacciones y matches mediante FastAPI. La confirmación de correo, los tres modos y la mensajería son requisitos de producto futuro.

## Dirección visual

Una portada editorial con fondo claro frío, superficies amplias, texto oscuro y vinotinto para la acción principal. El azul distingue enlaces y foco, y el dorado se reserva para acentos o superficies con texto oscuro. En modo oscuro, el fondo azul tinta enmarca superficies elevadas y acentos más claros. Usar el nombre TinderUD como marca tipográfica, con un símbolo propio opcional. La identidad visual excluye el escudo y otros elementos institucionales protegidos.

En el hero, una composición estática de tres formas del mismo tamaño representa los modos. Los títulos y la explicación viven en HTML. La composición es decorativa, sin fotos o datos de perfiles, controles simulados ni estadísticas. Inter con fallback de sistema, una sola familia y pesos 400, 600 y 700. H1 fluido de 36 a 68 px con interlineado cercano a 1.06. Texto base de 16–18 px con interlineado de 1.55. Contenedor de hasta 1200 px, ritmo basado en 8 px y radios de 12–20 px.

| Rol | Claro | Oscuro |
| --- | --- | --- |
| Fondo / superficie | `#F7F8FC` / `#FFFFFF` | `#171B2C` / `#222840` |
| Texto principal / secundario | `#171B2C` / `#4B536B` | `#F7F8FC` / `#BCC4D9` |
| Acción principal / texto | `#851D35` / `#FFFFFF` | `#FFB7C6` / `#171B2C` |
| Enlaces y foco en superficie | `#3748B8` | `#B9C4FF` |
| Acento cálido / texto sobre acento | `#F0B94D` / `#171B2C` | `#F0B94D` / `#171B2C` |

Contraste calculado para colores planos. CTA claro 9.44:1, CTA oscuro 10.44:1, texto secundario sobre fondo claro 7.20:1 y sobre superficie oscura 8.33:1, enlace sobre fondo claro 7.11:1 y sobre fondo oscuro 10.09:1. El dorado sobre fondo claro da 1.68:1. Aplicarlo como decoración o superficie con texto oscuro, combinación que da 9.56:1. Revisar cada estado interactivo sobre el fondo real.

## Composición y contenido

| Sección | Composición y copy propuesto |
| --- | --- |
| Navbar | Marca enlazada a inicio. Anclas «Modos», «Cómo funciona», «Comunidad» y «Preguntas frecuentes». Selector «Apariencia» con Claro, Oscuro y Automático. Acciones «Iniciar sesión» y «Crear cuenta». |
| Hero | H1 «Tu próxima conexión comienza en la U». Eslogan «Conecta más allá del aula.» Descripción breve con citas, amistades y networking académico y profesional, dirigida a estudiantes de la UD. CTA principal «Crear cuenta» hacia `/register` y enlace secundario «Explorar los tres modos» hacia `#modos`. «Iniciar sesión» queda visible en la navegación. Indicar 18+ y proyecto independiente junto a la explicación. |
| Modos | Tres tarjetas de igual ancho y jerarquía, con icono, título y texto. **Citas** para conocer a alguien con quien compartir intereses. **Amistades** para ampliar el círculo y hacer planes. **Networking** para encontrar personas con intereses académicos y profesionales afines. Sin modo destacado ni CTA por tarjeta. |
| Cómo funciona | «Crea tu cuenta con correo y contraseña» → «Confirma tu correo» → «Completa tu perfil y elige un modo» → «Conecta cuando el interés sea mutuo en el mismo modo». Explicar que hay un perfil común con información específica por modo, tres recorridos independientes y que la conversación se habilitaría después del interés mutuo. Presentar estos pasos como la experiencia prevista. |
| Comunidad, privacidad y seguridad | Tres mensajes concretos. Participación para estudiantes de la UD de 18 años o más. Perfiles privados para usuarios autenticados con correo confirmado, como regla del producto previsto. Conversaciones condicionadas al interés mutuo. Evitar insignias de verificación universitaria y promesas de moderación o protección que aún no existen. |
| Preguntas frecuentes | Incluir «¿Necesito correo institucional?» (registro previsto sin acreditación obligatoria), «¿Qué confirma mi correo?» (acceso a la dirección, no pertenencia a la UD), «¿Quién podrá ver mi perfil?», «¿Puedo usar los tres modos?», «¿Cuándo podré conversar?» y «¿Qué edad debo tener?». |
| CTA final | «Conecta más allá del aula» y un único CTA «Crear cuenta», con acceso a inicio de sesión como enlace secundario si hace falta. Mantener el mismo destino y lenguaje del hero. |
| Footer | Marca, Términos y Privacidad. Texto «TinderUD es un proyecto independiente. No está afiliado ni respaldado por la Universidad Distrital Francisco José de Caldas». Los enlaces legales públicos requieren destinos con contenido aprobado. |

### Responsive

- **Móvil, desde 320 px.** Marca, tema y menú compacto. Las anclas y los accesos de autenticación quedan en el menú. Hero de una columna con texto y CTA primero, composición después. Tarjetas, pasos y bloques de confianza apilados, sin desplazamiento horizontal. El footer puede apilar sus enlaces.
- **Tableta.** Mantener el hero apilado si la segunda columna reduce la legibilidad. Desde el breakpoint `md` de MUI, pasar los modos a tres columnas cuando títulos y descripciones quepan con holgura.
- **Escritorio.** Navbar completa, hero en dos columnas y tarjetas en tres columnas equivalentes. FAQ en una columna de lectura estrecha y CTA con espacio suficiente alrededor.

```text
MÓVIL                              ESCRITORIO
Marca     Apariencia     Menú      Marca    Anclas    Apariencia    Acceso
H1 + eslogan                       H1 + eslogan              Composición
Crear cuenta / Explorar            Crear cuenta / Explorar   de tres nodos
Composición de tres nodos
Citas                              Citas       Amistades       Networking
Amistades
Networking                         Cómo funciona en cuatro pasos
Cómo funciona                      Comunidad, privacidad y seguridad
Comunidad y privacidad             FAQ en columna de lectura
FAQ                                CTA final
CTA final                          Footer legal e independencia
Footer
```

## Arquitectura futura

- **`frontend/src/app/page.tsx`.** Pasar de la portada provisional cliente a una página servidor. Mantener el contenido, anclas y metadatos en el HTML inicial. Agrupar componentes por sección bajo `frontend/src/features/landing/` si su tamaño justifica separarlos. Usar Container, Box, Typography, Button, Card y componentes accesibles de MUI. Limitar componentes cliente propios al menú, selector de tema y microinteracciones que los requieran. Usar props serializables al cruzar el límite y mantener callbacks de `sx` en componentes cliente.
- **`layout.tsx`, `AppProviders.tsx` y `theme.ts`.** Conservar `AppRouterCacheProvider` de `@mui/material-nextjs/v16-appRouter`, `ThemeProvider` y `CssBaseline`. Sustituir la paleta fija por `colorSchemes.light/dark` con variables CSS y `colorSchemeSelector: 'class'`. Colocar `InitColorSchemeScript` como primer hijo de `body`, con `attribute="class"` y `defaultMode="system"` alineado con el provider. El cambio esperado de clase antes de hidratar justifica `suppressHydrationWarning` solo en `html`. Usar tokens y `theme.applyStyles()` para estilos dependientes del tema. El CSS global actual fija fondo, texto y `color-scheme` según el sistema. Retirar esa duplicación al implementar y conservar los estilos globales estructurales que sigan siendo útiles. Quitar el `overflow-x: hidden` global si oculta un fallo de reflow, y definir el subrayado de los enlaces en texto aunque el reset lo retire.
- **Persistencia.** Usar `useColorScheme()` y la persistencia local de MUI como única fuente de preferencia. Si se personaliza `modeStorageKey`, compartir exactamente el mismo valor entre script y provider. Mientras `mode` sea indefinido, renderizar un estado neutral estable y del mismo tamaño para el selector. Probar recarga, nueva pestaña y cambio de preferencia del sistema.
- **Rutas.** La portada apunta a `/login` y `/register`. Hoy esos destinos no existen en el frontend. La futura entrega de la landing necesita pantallas informativas temporales en ambos destinos, sin capturar credenciales, o rutas reales ya aprobadas. Si se usan pantallas informativas, mostrar «Registro en preparación» o «Acceso en preparación» junto al enlace antes del clic. Alinear la etiqueta del enlace con lo que encontrará la persona, por ejemplo «Ver estado del registro». Para enlaces legales, proponer `/terminos` y `/privacidad` y confirmar su contenido y disponibilidad antes de publicar. Para enlaces MUI que compongan `next/link` a través de una frontera servidor-cliente, verificar el wrapper cliente indicado para Next.js 16. Un enlace HTML basta para anclas internas.
- **Datos y rendimiento.** La landing puede ser estática. Reutilizar el cache provider y mantener TanStack Query para estado remoto donde se use. La portada no necesita consultas, estado global adicional ni llamadas FastAPI. Priorizar el texto del hero como contenido inicial, evitar animaciones de entrada que oculten el H1 y fijar dimensiones de los elementos visuales. En el build, medir el JavaScript inicial de MUI, Query y Motion, y comprobar si los enlaces precargan pantallas informativas que no necesitan prefetch. Si se carga Inter con `next/font`, verificar disponibilidad en el build o usar una fuente local ya autorizada.
- **Movimiento.** Transiciones de 120–180 ms para feedback de controles. Motion solo en una interacción que se beneficie de él, por ejemplo una transición breve de opacidad en la composición decorativa. Configurar `MotionConfig reducedMotion="user"` y suprimir también animaciones de opacidad no esenciales para movimiento reducido. La lectura y la navegación deben funcionar con la animación desactivada.

## Revisión coordinada

Antigravity propuso la composición, la jerarquía de los tres modos y los estados visuales. Kiro verificó los providers y APIs instalados e identificó el conflicto de tema en el CSS global. Codex recalculó contrastes, consultó Context7 y revisó el borrador contra las siete skills compartidas. La consolidación incorpora su ajuste de foco y distingue el alcance de registro previsto de las rutas informativas.

## Criterios de revisión

- Navegación por teclado desde «Saltar al contenido». H1 único, landmarks y orden de encabezados. Foco visible con anillo de 2 px y separación de 2 px respecto al control como punto de partida. Los anillos azul/vinotinto y azul claro/rosa ofrecen solo 1.25:1 y 1.04:1 entre sí. Usar el anillo separado sobre la superficie o un anillo doble donde el fondo cambie, y comprobar 3:1 sobre los colores adyacentes. El menú y la FAQ deben abrir, cerrar y devolver el foco cuando corresponda. En móvil, preferir controles de 44 × 44 CSS px y verificar los criterios WCAG de tamaño mínimo y separación.
- Validar contraste AA de texto y controles, foco no oculto, reflow a 320 px, zoom de 200 %, teclado, lector de pantalla y preferencia de movimiento reducido. Una auditoría estática no demuestra todas esas condiciones.
- Verificar claro, oscuro y automático antes del primer pintado, al recargar, al navegar y al cambiar el sistema. Revisar errores de hidratación y capturas a 320, 768 y 1440 px. Comprobar que todos los enlaces visibles tengan destino y que la portada no emita solicitudes de autenticación.
- Antes de publicar, confirmar los textos legales y que cada frase sobre registro, privacidad y conversaciones describe claramente su disponibilidad. El informe académico orienta los casos de uso. El código de FastAPI confirma el alcance actual. La dependencia que protege perfiles valida el token Bearer y aún carece de una condición de correo confirmado.

Referencias [informe académico](sourceTinderUD/informe_tinder_ud.tex), [API FastAPI](../backend/app.py), [reglas de Next.js](../frontend/AGENTS.md), [provider actual](../frontend/src/providers/AppProviders.tsx), [tema actual](../frontend/src/theme/theme.ts), [configuración de variables CSS de MUI 9.5.0](https://mui.com/material-ui/customization/css-theme-variables/configuration/), [integración de MUI con Next.js](https://mui.com/material-ui/integrations/nextjs/), [Motion y accesibilidad](https://motion.dev/docs/react-accessibility) y [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

La revisión de Codex consultó Next.js 16.4.5 y MUI 9.2.0 vía Context7. El límite de componentes y la configuración del tema coinciden con la documentación instalada de Next.js 16.4.6 y MUI 9.5.0 para los puntos evaluados. Para los detalles de tipos y comportamiento se priorizan los paquetes instalados. MUI 9.5.0 incorpora correcciones de defaultProps del tema y exportaciones. [Registro de Context7](multiagent.md#context7).
