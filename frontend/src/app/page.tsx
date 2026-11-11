import { Box } from "@mui/material";

import { SkipLink } from "@/features/landing/components/SkipLink";
import { Navbar } from "@/features/landing/components/Navbar";
import { Hero } from "@/features/landing/sections/Hero";
import { Modes } from "@/features/landing/sections/Modes";
import { HowItWorks } from "@/features/landing/sections/HowItWorks";
import { Community } from "@/features/landing/sections/Community";
import { Faq } from "@/features/landing/sections/Faq";
import { CtaFinal } from "@/features/landing/sections/CtaFinal";
import { Footer } from "@/features/landing/sections/Footer";

// Página servidor: el contenido, anclas y metadatos viven en el HTML inicial.
// Las únicas islas cliente son Navbar (menú y selector de tema) y las
// microinteracciones del hero y la FAQ.
export default function HomePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <SkipLink />
      <Navbar />
      <Box component="main" id="contenido" sx={{ flex: 1 }}>
        <Hero />
        <Modes />
        <HowItWorks />
        <Community />
        <Faq />
        <CtaFinal />
      </Box>
      <Footer />
    </Box>
  );
}
