import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useCapacidades } from "@/app/capacidades";
import { useAreaFicha } from "@/shared/context/area-record-context";
import { RecordList } from "@/modules/area-forms/components";
import { guarderiaApi, childrenPage } from "../api/guarderia-api";
export function GuarderiaListPage() {
  const { beneficiariaId = "", hijoId = "" } = useParams();
  const [search] = useSearchParams(),
    childPage = childrenPage(search.get("paginaHijos"));
  const { setArea } = useAreaFicha();
  useEffect(() => {
    setArea("Guardería");
    return () => setArea("");
  }, [setArea]);
  const caps = useCapacidades(),
    base = "/beneficiarias/" + beneficiariaId + "/guarderia";
  return (
    <RecordList
      key={base + "/" + hijoId + "/" + childPage}
      title="Guardería"
      area="Guardería"
      beneficiaryId={beneficiariaId}
      queryKey={[
        "guarderia",
        "beneficiaria",
        beneficiariaId,
        "hijo",
        hijoId,
        "fichas",
        childPage,
      ]}
      load={(page, signal) =>
        guarderiaApi.list(beneficiariaId, hijoId, page, childPage, signal)
      }
      open={(id) => base + "/fichas/" + id + "?paginaHijos=" + childPage}
      create={base + "/nueva?ninoId=" + hijoId + "&paginaHijos=" + childPage}
      canCreate={caps.crearFicha}
      discard={caps.editarFicha ? guarderiaApi.discard : undefined}
    />
  );
}
