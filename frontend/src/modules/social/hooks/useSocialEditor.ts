import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { validarCabeceraSocial } from "../validation/validar-cabecera";
import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { consultaDesdeQuery } from "@/shared/api/query-result";
import { useUnsavedChanges } from "@/shared/hooks/useUnsavedChanges";
import type { Ficha } from "@/shared/types/api";
import { socialApi } from "../api/social-api";

function localDate(value: string) {
  return new Date(value)
    .toLocaleString("sv-SE", { timeZone: "America/Guatemala" })
    .slice(0, 16)
    .replace(" ", "T");
}

export function useSocialEditor(beneficiaryId: string, id: string) {
  const navigate = useNavigate();
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: ["social", "beneficiaria", beneficiaryId, "ficha", id],
      queryFn: ({ signal }) =>
        id ? socialApi.get(id, signal, beneficiaryId) : Promise.resolve(null),
      enabled: Boolean(id),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const [record, setRecord] = useState<Ficha>();
  const [detail, setDetail] = useState<Record<string, unknown>>({});
  const [attention, setAttention] = useState("");
  const [professional, setProfessional] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const allowNavigation = useUnsavedChanges(dirty);
  // Inicializa el borrador antes de habilitar la interacción con los campos.
  useLayoutEffect(() => {
    setRecord(query.datos);
    setDetail(query.datos?.detalle ?? {});
    setAttention(query.datos ? localDate(query.datos.fechaAtencion) : "");
    setProfessional(query.datos?.profesionalId ?? "");
    setDirty(false);
  }, [query.datos]);
  const state = record?.estadoCodigo ?? record?.estado ?? "";
  const draft = !record || state.endsWith("BORRADOR");
  const conflict =
    error instanceof ApiError && error.body.codigo === "VERSION_DESACTUALIZADA";
  const uncertain =
    error instanceof ApiError &&
    ["RESPUESTA_NO_RECIBIDA", "RESULTADO_OPERACION_INCIERTO"].includes(
      error.body.codigo,
    );
  function change(field: string, value: string) {
    setDetail((current) => ({ ...current, [field]: value }));
    setDirty(true);
    setMessage("");
  }
  const mutationClient = useQueryClient();
  const operation = useMutation({
    mutationKey: [
      "social",
      "beneficiaria",
      beneficiaryId,
      "useSocialEditor.ts",
      "submit",
    ],
    mutationFn: (args: Parameters<typeof executeSubmit>) =>
      executeSubmit(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["social", "beneficiaria", beneficiaryId],
        refetchType: "none",
      });

      // La elegibilidad para adjuntar PDF puede cambiar al guardar o confirmar la ficha.
      void mutationClient.invalidateQueries({
        queryKey: ["documentos", beneficiaryId, "contexto"],
        refetchType: "none",
      });
    },
  });
  const mutationGate = useRef(false);
  function submit(confirm = false) {
    if (mutationGate.current) return Promise.resolve(undefined);
    mutationGate.current = true;
    return operation
      .mutateAsync([confirm])
      .catch(() => undefined)
      .finally(() => {
        mutationGate.current = false;
      });
  }
  async function executeSubmit(confirm = false) {
    if (
      lock.current ||
      conflict ||
      uncertain ||
      (confirm && (!record || dirty))
    )
      return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      const normalized = Object.fromEntries(
        Object.entries(detail).map(([key, value]) => [
          key,
          value === "" || value === null
            ? null
            : key === "dependenciaEconomica"
              ? value === true || value === "true"
              : value,
        ]),
      );
      let next: Ficha;
      if (confirm && record)
        next = await socialApi.confirm(record.id, record.version);
      else {
        // La entrada de fecha representa Guatemala, independiente de la zona del dispositivo.
        const { fechaAtencion: date, profesionalId: actor } =
          validarCabeceraSocial(attention, professional);
        next = record
          ? await socialApi.save(
              record.id,
              record.version,
              normalized,
              date,
              actor,
            )
          : await socialApi.create(beneficiaryId, {
              fechaAtencion: date,
              profesionalId: actor,
              detalle: normalized,
            });
      }
      setRecord(next);
      setDetail(next.detalle);
      setDirty(false);
      setMessage(confirm ? "Ficha confirmada." : "Cambios guardados.");
      allowNavigation();
      if (!record)
        navigate(`/beneficiarias/${beneficiaryId}/social/${next.id}`, {
          replace: true,
        });
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function reload() {
    if (
      dirty &&
      !window.confirm(
        "Hay cambios sin guardar. ¿Deseas descartarlos y cargar la versión vigente?",
      )
    )
      return;
    setError(undefined);
    query.recargar();
  }
  return {
    ...query,
    record,
    detail,
    attention,
    professional,
    dirty,
    busy,
    error: error ?? query.error,
    message,
    draft,
    conflict,
    uncertain,
    change,
    submit,
    reload,
    setAttention: (value: string) => {
      setAttention(value);
      setDirty(true);
    },
    setProfessional: (value: string) => {
      setProfessional(value);
      setDirty(true);
    },
  };
}
