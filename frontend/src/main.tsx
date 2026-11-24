import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { AppProviders } from "./app/providers/AppProviders";
import "./styles/index.css";

const root = document.getElementById("root");

if (!root) throw new Error("No se encontró el contenedor principal.");

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
