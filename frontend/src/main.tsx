import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { soloLectura } from "./shared/types/api";
import "./styles/tokens.css";
const demo =
  import.meta.env.DEV && import.meta.env.VITE_DEV_CAPABILITIES === "true";
const capacidades = demo
  ? {
      crearFicha: true,
      editarFicha: true,
      confirmarFicha: true,
      crearReferencia: true,
      corregirReferencia: true,
      crearEvolucion: true,
      corregirEvolucion: true,
      verRevisiones: true,
    }
  : soloLectura;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App capacidades={capacidades} />
  </StrictMode>,
);
