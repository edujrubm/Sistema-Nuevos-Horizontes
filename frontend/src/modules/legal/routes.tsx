import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyPage } from "@/shared/components/LazyPage";
/** Rutas públicas: no modifica la composición de otros módulos. */
const LegalListPage = lazy(() =>
  import("./index").then((m) => ({ default: m.LegalListPage })),
);
const LegalEditorPage = lazy(() =>
  import("./index").then((m) => ({ default: m.LegalEditorPage })),
);
export const legalRoutes: RouteObject[] = [
  { path: "legal", element: lazyPage(<LegalListPage />) },
  { path: "legal/nueva", element: lazyPage(<LegalEditorPage />) },
  { path: "legal/:fichaId", element: lazyPage(<LegalEditorPage />) },
  { path: "referencias", element: lazyPage(<LegalListPage reference />) },
  {
    path: "referencias/nueva",
    element: lazyPage(<LegalEditorPage reference />),
  },
  {
    path: "referencias/:fichaId",
    element: lazyPage(<LegalEditorPage reference />),
  },
];
