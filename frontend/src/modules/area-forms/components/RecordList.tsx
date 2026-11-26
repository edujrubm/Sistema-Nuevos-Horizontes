import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import type { Ficha, Pagina } from "@/shared/types/api";
import { useBeneficiaria } from "@/shared/context/area-record-context";
import { Paginacion } from "@/shared/components/feedback";
import { PageHeader } from "@/shared/components/PageHeader";
import { AreaFormList } from "./AreaFormList";
import { asAreaForm } from "./record-presentation";

/** Listado y descarte compartidos; cada módulo suministra sus rutas y operaciones existentes. */
export function RecordList({
  title,
  area,
  beneficiaryId,
  queryKey,
  load,
  open,
  create,
  canCreate,
  discard,
}: {
  title: string;
  area: string;
  beneficiaryId: string;
  queryKey: readonly unknown[];
  load: (
    page: number,
    signal: AbortSignal,
  ) => Promise<Pagina<Ficha> & { child?: { nombre: string } }>;
  open: (id: string) => string;
  create: string;
  canCreate: boolean;
  discard?: (id: string, version: number, reason: string) => Promise<unknown>;
}) {
  const [page, setPage] = useState(1),
    [discarding, setDiscarding] = useState<string>();
  const [error, setError] = useState<string>();
  const locked = useRef(false),
    navigate = useNavigate(),
    client = useQueryClient(),
    person = useBeneficiaria();
  const query = useQuery({
    queryKey: [...queryKey, page],
    queryFn: ({ signal }) => load(page, signal),
    retry: false,
  });
  async function remove(record: Ficha, reason: string) {
    if (!discard || locked.current) return;
    locked.current = true;
    setDiscarding(record.id);
    setError(undefined);
    try {
      await discard(record.id, record.version, reason);
      await client.invalidateQueries({ queryKey });
      void client.invalidateQueries({
        queryKey: ["documentos", beneficiaryId, "contexto"],
      });
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.body.mensaje
          : "No fue posible descartar el borrador.",
      );
      throw failure;
    } finally {
      locked.current = false;
      setDiscarding(undefined);
    }
  }
  return (
    <>
      <PageHeader
        title={title}
        description={`Fichas y atención de ${query.data?.child?.nombre ?? person?.nombre ?? "la beneficiaria"}.`}
        action={
          <Link
            className="button secondary"
            to={`/beneficiarias/${beneficiaryId}`}
          >
            Volver al expediente
          </Link>
        }
      />
      <AreaFormList
        forms={(query.data?.datos ?? []).map((r) => asAreaForm(r, area))}
        loading={query.isLoading}
        error={
          query.error instanceof ApiError
            ? query.error.body.mensaje
            : query.error
              ? "No fue posible cargar las fichas."
              : undefined
        }
        createDisabled={!canCreate}
        onCreate={() => navigate(create)}
        onOpen={(form) => navigate(open(form.id))}
        onRetry={() => {
          void query.refetch();
        }}
        onDiscard={discard ? remove : undefined}
        discardingId={discarding}
        discardError={error}
      />
      {query.data && <Paginacion {...query.data} cambiar={setPage} />}
    </>
  );
}
