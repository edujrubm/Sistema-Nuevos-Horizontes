import { useState, useEffect, useCallback } from "react";
export function useConsulta<T>(cargar: (signal: AbortSignal) => Promise<T>) {
  const [datos, setDatos] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [cargando, setCargando] = useState(true);
  const [revision, setRevision] = useState(0);
  const recargar = useCallback(() => setRevision((x) => x + 1), []);
  useEffect(() => {
    const c = new AbortController();
    setCargando(true);
    setError(undefined);
    setDatos(undefined);
    cargar(c.signal)
      .then((x) => {
        if (!c.signal.aborted) setDatos(x);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e);
      })
      .finally(() => {
        if (!c.signal.aborted) setCargando(false);
      });
    return () => c.abort();
  }, [cargar, revision]);
  return { datos, error, cargando, recargar };
}
