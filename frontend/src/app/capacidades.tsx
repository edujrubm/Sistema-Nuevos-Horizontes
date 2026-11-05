import { createContext, useContext } from "react";
import { soloLectura } from "../shared/types/api";
export const CapacidadesContext = createContext(soloLectura);
export const useCapacidades = () => useContext(CapacidadesContext);
