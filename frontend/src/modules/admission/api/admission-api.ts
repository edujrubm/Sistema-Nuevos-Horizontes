import { apiRequest } from "@/shared/api/http-client";

export interface StartAdmissionInput {
  nombre: string;
  cui?: string;
  fechaNacimiento?: string;
  lugar?: string;
  fechaEntrevista?: string;
}

interface StartAdmissionResponse {
  data: { fichaInicial: { id: string; version: number; estado: string } };
}

export function startAdmission(input: StartAdmissionInput) {
  return apiRequest<StartAdmissionResponse>("/fichas-iniciales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
