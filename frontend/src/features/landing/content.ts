// Contenido estático y serializable de la landing pública.
// Vive en el servidor; se pasa a las islas cliente por props serializables.

export type NavAnchor = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
};

export const NAV_ANCHORS: readonly NavAnchor[] = [
  { id: "modos", label: "Modos", href: "#modos" },
  { id: "como-funciona", label: "Cómo funciona", href: "#como-funciona" },
  { id: "comunidad", label: "Comunidad", href: "#comunidad" },
  { id: "preguntas", label: "Preguntas frecuentes", href: "#preguntas" },
];

export type ModeKind = "citas" | "amistades" | "networking";

export type ModeCard = {
  readonly id: ModeKind;
  readonly title: string;
  readonly description: string;
};

// Tres modos de igual jerarquía, sin destacado ni CTA por tarjeta.
export const MODES: readonly ModeCard[] = [
  {
    id: "citas",
    title: "Citas",
    description:
      "Conoce a alguien con quien compartir intereses y empezar algo nuevo.",
  },
  {
    id: "amistades",
    title: "Amistades",
    description: "Amplía tu círculo, encuentra afinidades y hagan planes juntos.",
  },
  {
    id: "networking",
    title: "Networking",
    description:
      "Encuentra personas con intereses académicos y profesionales afines.",
  },
];

export type Step = {
  readonly order: number;
  readonly title: string;
  readonly description: string;
};

export const STEPS: readonly Step[] = [
  {
    order: 1,
    title: "Crea tu cuenta con correo y contraseña",
    description:
      "El registro previsto no exige acreditación universitaria obligatoria.",
  },
  {
    order: 2,
    title: "Confirma tu correo",
    description:
      "Confirmar verifica el acceso a la dirección, no la pertenencia a la UD.",
  },
  {
    order: 3,
    title: "Completa tu perfil y elige un modo",
    description:
      "Un perfil común con información específica por modo y tres recorridos independientes.",
  },
  {
    order: 4,
    title: "Conecta cuando el interés sea mutuo en el mismo modo",
    description:
      "La conversación se habilitaría después del interés mutuo dentro del mismo modo.",
  },
];

export type TrustMessage = {
  readonly title: string;
  readonly description: string;
};

export const TRUST_MESSAGES: readonly TrustMessage[] = [
  {
    title: "Para estudiantes de la UD, 18 años o más",
    description:
      "La participación está pensada para estudiantes de la Universidad Distrital de 18 años en adelante.",
  },
  {
    title: "Perfiles privados",
    description:
      "Como regla del producto previsto, los perfiles serían visibles para usuarios autenticados con correo confirmado.",
  },
  {
    title: "Conversaciones por interés mutuo",
    description:
      "Las conversaciones quedarían condicionadas al interés mutuo en el mismo modo.",
  },
];

export type FaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export const FAQ: readonly FaqItem[] = [
  {
    id: "faq-correo-institucional",
    question: "¿Necesito correo institucional?",
    answer:
      "El registro previsto no exige correo institucional ni acreditación obligatoria de pertenencia a la universidad.",
  },
  {
    id: "faq-confirma-correo",
    question: "¿Qué confirma mi correo?",
    answer:
      "Confirmar tu correo verifica que tienes acceso a esa dirección. No certifica tu pertenencia a la Universidad Distrital.",
  },
  {
    id: "faq-quien-ve-perfil",
    question: "¿Quién podrá ver mi perfil?",
    answer:
      "Según el producto previsto, los perfiles serían privados y visibles solo para usuarios autenticados con correo confirmado.",
  },
  {
    id: "faq-tres-modos",
    question: "¿Puedo usar los tres modos?",
    answer:
      "Sí. Citas, Amistades y Networking son tres recorridos independientes con un perfil común e información específica por modo.",
  },
  {
    id: "faq-cuando-conversar",
    question: "¿Cuándo podré conversar?",
    answer:
      "La conversación se habilitaría cuando el interés sea mutuo entre dos personas dentro del mismo modo.",
  },
  {
    id: "faq-edad",
    question: "¿Qué edad debo tener?",
    answer: "Debes tener 18 años o más para participar.",
  },
];

// Textos legales pendientes: se muestran como texto, sin href vacío.
export const LEGAL_LINKS: readonly string[] = ["Términos", "Privacidad"];

export const INDEPENDENCE_NOTICE =
  "TinderUD es un proyecto independiente. No está afiliado ni respaldado por la Universidad Distrital Francisco José de Caldas.";
