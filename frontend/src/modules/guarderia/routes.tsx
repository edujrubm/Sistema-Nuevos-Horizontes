import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyPage } from "@/shared/components/LazyPage";
/** Rutas públicas: no modifica la composición de otros módulos. */
const GuarderiaChildrenPage = lazy(() =>
  import("./index").then((m) => ({ default: m.GuarderiaChildrenPage })),
);
const GuarderiaListPage = lazy(() =>
  import("./index").then((m) => ({ default: m.GuarderiaListPage })),
);
const GuarderiaEditorPage = lazy(() =>
  import("./index").then((m) => ({ default: m.GuarderiaEditorPage })),
);
export const guarderiaRoutes: RouteObject[] = [
  { path: "guarderia", element: lazyPage(<GuarderiaChildrenPage />) },
  { path: "guarderia/nueva", element: lazyPage(<GuarderiaEditorPage />) },
  {
    path: "guarderia/fichas/:fichaId",
    element: lazyPage(<GuarderiaEditorPage />),
  },
  { path: "guarderia/:hijoId", element: lazyPage(<GuarderiaListPage />) },
];
