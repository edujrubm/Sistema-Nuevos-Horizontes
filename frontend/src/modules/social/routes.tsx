import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { lazyPage } from "@/shared/components/LazyPage";
/** Rutas públicas: no modifica la composición de otros módulos. */
const SocialListPage = lazy(() =>
  import("./index").then((m) => ({ default: m.SocialListPage })),
);
const SocialEditorPage = lazy(() =>
  import("./index").then((m) => ({ default: m.SocialEditorPage })),
);
export const socialRoutes: RouteObject[] = [
  { path: "social", element: lazyPage(<SocialListPage />) },
  { path: "social/nueva", element: lazyPage(<SocialEditorPage />) },
  { path: "social/:fichaId", element: lazyPage(<SocialEditorPage />) },
];
