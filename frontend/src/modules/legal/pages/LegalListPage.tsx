import { useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import { RecordList } from "@/modules/area-forms/components";
import { legalApi } from "../api/legal-api";
export function LegalListPage({ reference = false }: { reference?: boolean }) {
  const { beneficiariaId = "" } = useParams();
  const caps = useCapacidades();
  const base =
    "/beneficiarias/" +
    beneficiariaId +
    "/" +
    (reference ? "referencias" : "legal");
  return (
    <RecordList
      key={base}
      title={reference ? "Referencias legales" : "Legal"}
      area="Legal"
      beneficiaryId={beneficiariaId}
      queryKey={["legal", "beneficiaria", beneficiariaId, "listado", reference]}
      load={(page, signal) =>
        legalApi.list(beneficiariaId, reference, page, signal)
      }
      open={(id) => base + "/" + id}
      create={base + "/nueva"}
      canCreate={reference ? caps.crearReferencia : caps.crearFicha}
      discard={!reference && caps.editarFicha ? legalApi.discard : undefined}
    />
  );
}
