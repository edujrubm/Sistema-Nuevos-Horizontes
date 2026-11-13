import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConsulta } from "@/shared/hooks/useConsulta";
import { useUnsavedChanges } from "@/shared/hooks/useUnsavedChanges";
import { ApiError } from "@/shared/api/http";
import type { Ficha } from "@/shared/types/api";
import { legalApi } from "../api/legal-api";

export function useLegalEditor(
  beneficiaryId: string,
  id: string,
  reference: boolean,
) {
  const navigate = useNavigate();
  const query = useConsulta(
    useCallback(
      (signal: AbortSignal) =>
        id ? legalApi.get(id, reference, signal) : Promise.resolve(undefined),
      [id, reference],
    ),
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
    error instanceof ApiError && error.codigo === "VERSION_DESACTUALIZADA";
  // Una respuesta incierta no permite repetir una escritura que pudo guardarse.
  const uncertain =
    error instanceof ApiError &&
    ["RESPUESTA_NO_RECIBIDA", "RESULTADO_OPERACION_INCIERTO"].includes(
      error.codigo,
    );
  function change(field: string, value: string) {
    setDetail((current) => ({ ...current, [field]: value }));
    setDirty(true);
    setMessage("");
  }
  async function submit(confirm = false) {
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
      else
        next = await legalApi.create(beneficiaryId, reference, {
          // datetime-local representa la fecha institucional de Guatemala, no la zona del dispositivo.
          fechaAtencion: new Date(attention + "-06:00").toISOString(),
          profesionalId: /^\d+$/.test(professional)
            ? BigInt(professional).toString()
            : professional,
          detalle: normalized,
        });
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
