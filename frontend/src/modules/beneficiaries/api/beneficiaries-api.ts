import { apiRequest } from "@/shared/api/http-client";

export interface BeneficiarySummary {
  id: string;
  nombre: string;
  fechaNacimiento?: string | null;
  cuiEnmascarado?: string | null;
}

interface BeneficiariesResponse {
  data: BeneficiarySummary[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export function listBeneficiaries(search: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ limite: "20" });
  if (search.trim()) query.set("nombre", search.trim());
  return apiRequest<BeneficiariesResponse>(`/beneficiarias?${query}`, { signal });
}
