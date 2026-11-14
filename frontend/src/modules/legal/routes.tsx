import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyPage } from "@/shared/components/LazyPage";
const ListadoFichas = lazy(() =>
  import("../formularios/Listados").then((m) => ({ default: m.ListadoFichas })),
);
const Guarderia = lazy(() =>
  import("../formularios/Listados").then((m) => ({ default: m.Guarderia })),
);
const EditorFicha = lazy(() =>
  import("../formularios/EditorFicha").then((m) => ({
    default: m.EditorFicha,
  })),
);
/** Entrada pública de rutas del módulo; conserva la vista actual hasta su reconstrucción. */
export const legalRoutes: RouteObject[] = [
  { path: "legal", element: lazyPage(<ListadoFichas area="legal" />) },
  { path: "legal/nueva", element: lazyPage(<EditorFicha nueva legacy />) },
  { path: "legal/:fichaId", element: lazyPage(<EditorFicha legacy />) },
  {
    path: "referencias",
    element: lazyPage(<ListadoFichas area="referencias" />),
  },
  {
    path: "referencias/nueva",
    element: lazyPage(<EditorFicha nueva esReferencia legacy />),
  },
  {
    path: "referencias/:fichaId",
    element: lazyPage(<EditorFicha esReferencia legacy />),
  },
];
