import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { validarCabeceraGuarderia } from "../validation/validar-cabecera";
import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { consultaDesdeQuery } from "@/shared/api/query-result";
import { useUnsavedChanges } from "@/shared/hooks/useUnsavedChanges";
import type { Ficha } from "@/shared/types/api";
import { guarderiaApi } from "../api/guarderia-api";

function localDate(value: string) {
  return new Date(value)
    .toLocaleString("sv-SE", { timeZone: "America/Guatemala" })
    .slice(0, 16)
    .replace(" ", "T");
}

export function useGuarderiaEditor(beneficiaryId: string, id: string) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [ninoId, setNinoId] = useState(search.get("ninoId") ?? "");
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: ["guarderia", "beneficiaria", beneficiaryId, "ficha", id],
      queryFn: ({ signal }) =>
        id
          ? guarderiaApi.get(id, beneficiaryId, signal)
          : Promise.resolve(null),
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
  const [auxiliaryDirty, setAuxiliaryDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const allowNavigation = useUnsavedChanges(dirty || auxiliaryDirty);
  // Inicializa el borrador antes de habilitar la interacción con los campos.
  useLayoutEffect(() => {
    setRecord(query.datos);
    if (query.datos?.ninoId) setNinoId(query.datos.ninoId);
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
      "guarderia",
      "beneficiaria",
      beneficiaryId,
      "useGuarderiaEditor.ts",
      "submit",
    ],
    mutationFn: (args: Parameters<typeof executeSubmit>) =>
      executeSubmit(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["guarderia", "beneficiaria", beneficiaryId],
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
      (!record && !ninoId) ||
      auxiliaryDirty ||
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
            : key === "padeceEnfermedad"
              ? value === true || value === "true"
              : value,
        ]),
      );
      let next: Ficha;
      if (confirm && record)
        next = await guarderiaApi.confirm(record.id, record.version);
      else {
        // La entrada de fecha representa Guatemala, independiente de la zona del dispositivo.
        const { fechaAtencion: date, profesionalId: actor } =
          validarCabeceraGuarderia(attention, professional);
        next = record
          ? await guarderiaApi.save(
              record.id,
              record.version,
              normalized,
              date,
              actor,
            )
          : await guarderiaApi.create(beneficiaryId, {
              ninoId,
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
        navigate(
          `/beneficiarias/${beneficiaryId}/guarderia/fichas/${next.id}?paginaHijos=${search.get("paginaHijos") ?? "1"}`,
          {
            replace: true,
          },
        );
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
      (dirty || auxiliaryDirty) &&
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
    ninoId,
    setNinoId: (value: string) => {
      if (!record) {
        setNinoId(value);
        setDirty(true);
      }
    },
    setAuxiliaryDirty,
    auxiliaryDirty,
    acceptVersion: (version: number) =>
      setRecord((current) => (current ? { ...current, version } : current)),
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
