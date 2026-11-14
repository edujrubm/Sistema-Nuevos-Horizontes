import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { validarCabeceraLegal } from "../validation/validar-cabecera";
import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultaDesdeQuery } from "@/shared/api/query-result";
import { useUnsavedChanges } from "@/shared/hooks/useUnsavedChanges";

import type { Ficha } from "@/shared/types/api";
import { legalApi } from "../api/legal-api";

export function useLegalEditor(
  beneficiaryId: string,
  id: string,
  reference: boolean,
) {
  const navigate = useNavigate();
  const query = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "legal",
        "beneficiaria",
        beneficiaryId,
        "ficha",
        reference,
        id,
      ],
      queryFn: ({ signal }) =>
        id
          ? legalApi.get(id, reference, signal, beneficiaryId)
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
  const [reason, setReason] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [correction, setCorrection] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  const allowNavigation = useUnsavedChanges(dirty);
  // Inicializa el borrador antes de habilitar la interacción con los campos.
  useLayoutEffect(() => {
    setRecord(query.datos);
    setDetail(query.datos?.detalle ?? {});
    setDirty(false);
    setCorrection(false);
  }, [query.datos]);
  const state = record?.estadoCodigo ?? record?.estado ?? "";
  const draft = !record || state.endsWith("BORRADOR");
  const confirmed = state.endsWith("CONFIRMADO");
  const conflict =
    error instanceof ApiError && error.body.codigo === "VERSION_DESACTUALIZADA";
  // Una respuesta incierta no permite repetir una escritura que pudo guardarse.
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
      "legal",
      "beneficiaria",
      beneficiaryId,
      "useLegalEditor.ts",
      "submit",
    ],
    mutationFn: (args: Parameters<typeof executeSubmit>) =>
      executeSubmit(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["legal", "beneficiaria", beneficiaryId],
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
      locked.current ||
      conflict ||
      uncertain ||
      (confirm && (!record || dirty))
    )
      return;
    locked.current = true;
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      const normalized = Object.fromEntries(
        Object.entries(detail).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ]),
      );
      let next: Ficha;
      if (confirm && record)
        next = await legalApi.confirm(record.id, reference, record.version);
      else if (record)
        next = await legalApi.save(
          record.id,
          reference,
          record.version,
          correction ? reason : "Guardado de borrador",
          normalized,
        );
      else {
        const cabecera = validarCabeceraLegal(attention, professional);
        next = await legalApi.create(beneficiaryId, reference, {
          // datetime-local representa la fecha institucional de Guatemala, no la zona del dispositivo.
          fechaAtencion: cabecera.fechaAtencion,
          profesionalId: cabecera.profesionalId,
          detalle: normalized,
        });
      }
      setRecord(next);
      setDetail(next.detalle);
      setDirty(false);
      setCorrection(false);
      setMessage(confirm ? "Ficha confirmada." : "Cambios guardados.");
      allowNavigation();
      if (!record)
        navigate(
          `/beneficiarias/${beneficiaryId}/${reference ? "referencias" : "legal"}/${next.id}`,
          { replace: true },
        );
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      locked.current = false;
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
    reason,
    dirty,
    busy,
    correction,
    error: error ?? query.error,
    message,
    draft,
    confirmed,
    conflict,
    uncertain,
    change,
    submit,
    reload,
    setCorrection,
    setReason,
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
