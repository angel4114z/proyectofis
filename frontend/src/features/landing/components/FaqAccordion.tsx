"use client";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

import type { FaqItem } from "../content";

// Isla cliente: la FAQ abre y cierra cada panel con teclado y foco visibles.
//
// Encabezado accesible: MUI v9.5.0 ya envuelve el AccordionSummary en un
// <h3> propio (AccordionHeading = styled("h3")) y la región deriva su
// aria-labelledby/id del `id` y `aria-controls` del summary. Por eso el
// AccordionSummary debe ser hijo directo del Accordion (sin envolverlo en otro
// <h3>, que generaría <h3><h3><button> y rompería la propagación de id,
// causando el desajuste de hidratación #418). El texto interior es un span
// para no anidar un heading dentro del botón.
export function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  return (
    <>
      {items.map((item) => (
        <Accordion
          key={item.id}
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            "&:not(:last-of-type)": { mb: 1.5 },
            "&::before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreRoundedIcon />}
            aria-controls={`${item.id}-content`}
            id={`${item.id}-header`}
            sx={{ minHeight: 56 }}
          >
            <Typography component="span" sx={{ fontWeight: 600 }}>
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component="p" color="text.secondary">
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
