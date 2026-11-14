import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { useEffect, useRef, useState } from "react";
import { consultaDesdeQuery } from "@/shared/api/query-result";

import { Cargando, ErrorVista, Paginacion } from "@/shared/components/feedback";
import { FormErrorSummary } from "@/shared/components/forms";
import {
  padresApi,
  type DatosPadre,
  type PadreGuarderia,
} from "../api/padres-api";
const vacio: DatosPadre = {
  tipoVinculo: "BIOLOGICO",
  nombre: null,
  cui: null,
  telefono: null,
  direccion: null,
};
const campos = [
  ["nombre", "Nombre del padre"],
  ["cui", "DPI/CUI del padre"],
  ["telefono", "Teléfono del padre"],
  ["direccion", "Dirección del padre"],
] as const;
const etiquetas: Record<string, string> = {
  ...Object.fromEntries(campos),
  tipoVinculo: "Vínculo con el niño",
  motivo: "Motivo de la corrección",
  version: "Versión del registro",
};
/** Datos del niño compartidos entre sus fichas; no conceden permiso de traslado. */
export function PadresGuarderia({
  beneficiariaId,
  ninoId,
  visible,
  editable,
  onDirty,
}: {
  beneficiariaId: string;
  ninoId: string;
  visible: boolean;
  editable: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const consulta = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "guarderia",
        "beneficiaria",
        beneficiariaId,
        "hijo",
        ninoId,
        "padres",
        pagina,
      ],
      queryFn: ({ signal }) =>
        visible
          ? padresApi.listar(beneficiariaId, ninoId, pagina, signal)
          : Promise.resolve(null),
      enabled: Boolean(visible),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const [datos, setDatos] = useState<DatosPadre>({ ...vacio });
  const [registro, setRegistro] = useState<PadreGuarderia>();
  const [motivo, setMotivo] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [mensaje, setMensaje] = useState("");
  const lock = useRef(false);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const errores = error instanceof ApiError ? error.body.errores : [];
  const bloqueado =
    error instanceof ApiError &&
    [
      "VERSION_DESACTUALIZADA",
      "RESPUESTA_NO_RECIBIDA",
      "RESULTADO_OPERACION_INCIERTO",
    ].includes(error.body.codigo);
  function cancelar() {
    setDatos({ ...vacio });
    setRegistro(undefined);
    setMotivo("");
    setDirty(false);
    setError(undefined);
  }
  function editar(row: PadreGuarderia) {
    setRegistro(row);
    setDatos({
      tipoVinculo: row.tipoVinculo,
      nombre: row.nombre,
      cui: row.cui,
      telefono: row.telefono,
      direccion: row.direccion,
    });
    setMotivo("");
    setDirty(true);
    setError(undefined);
    setMensaje("");
  }
  const mutationClient = useQueryClient();
  const operation = useMutation({
    mutationKey: [
      "guarderia",
      "beneficiaria",
      beneficiariaId,
      "PadresGuarderia.tsx",
      "guardar",
    ],
    mutationFn: (args: Parameters<typeof executeGuardar>) =>
      executeGuardar(...args),
    retry: false,
    onSuccess: () => {
      void mutationClient.invalidateQueries({
        queryKey: ["guarderia", "beneficiaria", beneficiariaId],
        refetchType: "none",
      });

      // La elegibilidad para adjuntar PDF puede cambiar al guardar o confirmar la ficha.
      void mutationClient.invalidateQueries({
        queryKey: ["documentos", beneficiariaId, "contexto"],
        refetchType: "none",
      });
    },
  });
  const mutationGate = useRef(false);
  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (mutationGate.current) return Promise.resolve(undefined);
    mutationGate.current = true;
    return operation
      .mutateAsync([])
      .catch(() => undefined)
      .finally(() => {
        mutationGate.current = false;
      });
  }
  async function executeGuardar() {
    if (lock.current || !editable || bloqueado) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setMensaje("");
    try {
      const input = {
        ...datos,
        ...Object.fromEntries(
          campos.map(([key]) => [key, datos[key]?.trim() || null]),
        ),
      };
      if (registro)
        await padresApi.editar(
          beneficiariaId,
          ninoId,
          registro.id,
          input,
          registro.version,
          motivo,
        );
      else await padresApi.crear(beneficiariaId, ninoId, input);
      cancelar();
      setMensaje("Datos del padre guardados.");
      consulta.recargar();
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const mensajeCampo = (campo: string) =>
    errores
      .filter((e) => e.campo === campo)
      .map((e) => e.mensaje)
      .join(" ");
  const accesibilidad = (campo: string) => ({
    id: `guarderia-padre-${campo}`,
    "aria-label": etiquetas[campo],
    "aria-invalid": Boolean(mensajeCampo(campo)) || undefined,
    "aria-describedby": mensajeCampo(campo)
      ? `guarderia-padre-${campo}-error`
      : undefined,
  });
  const errorCampo = (campo: string) =>
    mensajeCampo(campo) ? (
      <span className="field-error" id={`guarderia-padre-${campo}-error`}>
        {mensajeCampo(campo)}
      </span>
    ) : null;
  return (
    <section
      className="card"
      hidden={!visible}
      aria-label="Datos del padre en Guardería"
    >
      <h3>Datos del padre</h3>
      <p>
        Se registran por niño. La paternidad no autoriza a recogerlo ni
        trasladarlo.
      </p>
      <ErrorVista error={consulta.error} reintentar={consulta.recargar} />
      {consulta.cargando ? (
        <Cargando />
      ) : (
        consulta.datos && (
          <>
            {!consulta.datos.total && (
              <p>No hay datos del padre registrados para este niño.</p>
            )}
            {consulta.datos.datos.map((row) => (
              <section
                key={row.id}
                className="grid"
                aria-label={`Padre ${row.id}`}
              >
                <h4 className="full">
                  {row.tipoVinculo === "BIOLOGICO"
                    ? "Padre biológico"
                    : "Padre legal"}
                </h4>
                {campos.map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <span className="readonly">
                      {row[key] || "Sin registrar"}
                    </span>
                  </label>
                ))}
                {editable && (
                  <button
                    type="button"
                    disabled={dirty || busy}
                    onClick={() => editar(row)}
                  >
                    Editar{" "}
                    {row.nombre ||
                      `padre ${row.tipoVinculo === "LEGAL" ? "legal" : "biológico"}`}
                  </button>
                )}
              </section>
            ))}
            <Paginacion
              {...consulta.datos}
              cambiar={(p) => {
                if (!dirty && !busy) setPagina(p);
              }}
            />
          </>
        )
      )}
      <FormErrorSummary
        errors={errores.map((e) => ({
          fieldId: `guarderia-padre-${e.campo}`,
          label: etiquetas[e.campo] || "Datos del padre",
          message: e.mensaje,
        }))}
        requestId={
          error instanceof ApiError ? error.body.idSolicitud : undefined
        }
      />
      <ErrorVista error={errores.length ? undefined : error} />
      {bloqueado && (
        <p>
          Conservamos lo escrito. Consulta el registro vigente antes de volver a
          guardar.
        </p>
      )}
      {mensaje && <p role="status">{mensaje}</p>}
      {editable && (
        <form onSubmit={(e) => void guardar(e)}>
          <fieldset className="grid" disabled={busy || bloqueado}>
            <legend>
              {registro
                ? "Corregir datos del padre"
                : "Agregar datos del padre"}
            </legend>
            <label>
              Vínculo con el niño
              <select
                {...accesibilidad("tipoVinculo")}
                value={datos.tipoVinculo}
                onChange={(e) => {
                  setDatos((actual) => ({
                    ...actual,
                    tipoVinculo: e.target.value as DatosPadre["tipoVinculo"],
                  }));
                  setDirty(true);
                  setMensaje("");
                }}
              >
                <option value="BIOLOGICO">Biológico</option>
                <option value="LEGAL">Legal</option>
              </select>
              {errorCampo("tipoVinculo")}
            </label>
            {campos.map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  maxLength={20000}
                  {...accesibilidad(key)}
                  value={datos[key] ?? ""}
                  onChange={(e) => {
                    setDatos((actual) => ({
                      ...actual,
                      [key]: e.target.value,
                    }));
                    setDirty(true);
                    setMensaje("");
                  }}
                />
                {errorCampo(key)}
              </label>
            ))}
            {registro && (
              <label className="full">
                Motivo de la corrección
                <input
                  required
                  maxLength={2000}
                  {...accesibilidad("motivo")}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
                {errorCampo("motivo")}
              </label>
            )}
          </fieldset>
          <div className="actions">
            <button disabled={busy || bloqueado || !dirty} type="submit">
              Guardar datos del padre
            </button>
            <button disabled={busy} type="button" onClick={cancelar}>
              Cancelar captura del padre
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
