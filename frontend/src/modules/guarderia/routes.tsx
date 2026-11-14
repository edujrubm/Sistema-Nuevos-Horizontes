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
export const guarderiaRoutes: RouteObject[] = [
  { path: "guarderia", element: lazyPage(<Guarderia />) },
  { path: "guarderia/nueva", element: lazyPage(<EditorFicha nueva legacy />) },
  {
    path: "guarderia/fichas/:fichaId",
    element: lazyPage(<EditorFicha legacy />),
  },
  {
    path: "guarderia/:hijoId",
    element: lazyPage(<ListadoFichas area="guarderia" />),
  },
];
