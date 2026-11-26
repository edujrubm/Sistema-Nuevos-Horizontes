import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import { useAreaFicha } from "@/shared/context/area-record-context";
import { RecordList } from "@/modules/area-forms/components";
import { socialApi } from "../api/social-api";
export function SocialListPage() {
  const { beneficiariaId = "" } = useParams();
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Trabajo Social");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades();
  const base = "/beneficiarias/" + beneficiariaId + "/social";
  return (
    <RecordList
      key={base}
      title="Trabajo Social"
      area="Trabajo Social"
      beneficiaryId={beneficiariaId}
      queryKey={["social", "beneficiaria", beneficiariaId, "listado"]}
      load={(page, signal) => socialApi.list(beneficiariaId, page, signal)}
      open={(id) => base + "/" + id}
      create={base + "/nueva"}
      canCreate={caps.crearFicha}
      discard={caps.editarFicha ? socialApi.discard : undefined}
    />
  );
}
