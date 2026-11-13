import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
export function useUnsavedChanges(dirty: boolean) {
  const permitir = useRef(false);
  useEffect(() => {
    if (dirty) permitir.current = false;
  }, [dirty]);
  const blocker = useBlocker(() => dirty && !permitir.current);
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (
        window.confirm("Hay cambios sin guardar. ¿Deseas descartarlos y salir?")
      )
        blocker.proceed();
      else blocker.reset();
    }
  }, [blocker]);
  useEffect(() => {
    const avisar = (e: BeforeUnloadEvent) => {
      if (dirty && !permitir.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [dirty]);
  return () => {
    permitir.current = true;
  };
}
