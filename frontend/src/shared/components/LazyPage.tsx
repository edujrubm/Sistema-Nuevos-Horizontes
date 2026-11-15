import { Suspense, type ReactNode } from "react";
/** Mantiene el mismo estado de carga en las rutas cargadas por módulo. */
export function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <p className="status-message" role="status">
          Cargando pantalla…
        </p>
      }
    >
      {page}
    </Suspense>
  );
}
