"use client";

// Envoltorio cliente de next/link para usarlo con el prop `component` de MUI.
// Next.js 16 rechaza pasar next/link directamente a un Client Component
// ("Functions cannot be passed directly to Client Components").
import Link from "next/link";

export default Link;
