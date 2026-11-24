import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/api-error";
import { useEffect, useRef, useState } from "react";
import { consultaDesdeQuery } from "@/shared/api/query-result";

import { Cargando, ErrorVista, Paginacion } from "@/shared/components/feedback";
import {
  responsablesApi,
  type DatosResponsable,
  type ResponsableGuarderia,
} from "../api/responsables-api";
const vacio: DatosResponsable = {
  nombre: "",
  cui: "",
  relacion: "",
  telefono: "",
};
const campos = [
  ["nombre", "Nombre completo", 200],
  ["cui", "DPI/CUI", 20],
  ["relacion", "Relación o parentesco", 200],
  ["telefono", "Teléfono", 25],
] as const;
/** Conserva la captura al cambiar de sección y comparte la versión de la ficha. */
export function ResponsablesGuarderia({
  beneficiariaId,
  fichaId,
  version,
  editable,
  visible,
  onSaved,
  onDirty,
}: {
  beneficiariaId: string;
  fichaId: string;
  version: number;
  editable: boolean;
  visible: boolean;
  onSaved: (version: number) => void;
  onDirty: (dirty: boolean) => void;
}) {
  const [pagina, setPagina] = useState(1);
  const consulta = consultaDesdeQuery(
    useQuery({
      queryKey: [
        "guarderia",
        "beneficiaria",
        beneficiariaId,
        "ficha",
        fichaId,
        "responsables",
        pagina,
      ],
      queryFn: ({ signal }) =>
        visible
          ? responsablesApi.listar(beneficiariaId, fichaId, pagina, signal)
          : Promise.resolve(null),
      enabled: Boolean(visible),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );
  const [datos, setDatos] = useState<DatosResponsable>({ ...vacio });
  const [id, setId] = useState<string>();
  const [motivo, setMotivo] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);
  const blocked =
    error instanceof ApiError &&
    [
      "VERSION_DESACTUALIZADA",
      "RESPUESTA_NO_RECIBIDA",
      "RESULTADO_OPERACION_INCIERTO",
    ].includes(error.body.codigo);
  function cancelar() {
    setDatos({ ...vacio });
    setId(undefined);
    setMotivo("");
    setDirty(false);
    setError(undefined);
  }
  function editar(r: ResponsableGuarderia) {
    setDatos({
      nombre: r.nombre,
      cui: r.cui,
      relacion: r.relacion,
      telefono: r.telefono,
    });
    setId(r.id);
    setMotivo("");
    setDirty(true);
    setMessage("");
    setError(undefined);
  }
  const mutationClient = useQueryClient();
  const operation = useMutation({
    mutationKey: [
      "guarderia",
      "beneficiaria",
      beneficiariaId,
      "ResponsablesGuarderia.tsx",
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
  function guardar(event: React.FormEvent) {
    event.preventDefault();
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
    if (lock.current || !editable || blocked) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setMessage("");
    try {
      const response = await responsablesApi.guardar(
        beneficiariaId,
        fichaId,
        {
          ...datos,
          version,
          motivo: id
            ? motivo
            : "Registro de responsable autorizado en Guardería",
        },
        id,
      );
      onSaved(response.version);
      cancelar();
      setMessage(
        "Responsable guardado. Está autorizado para recoger y trasladar al niño.",
      );
      consulta.recargar();
    } catch (failure) {
      setError(failure);
      throw failure;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="card"
      hidden={!visible}
      aria-label="Responsables autorizados"
    >
      <h3>Personas adicionales autorizadas</h3>
      <p>Registrar a una persona la autoriza a recoger y trasladar al niño.</p>
      <ErrorVista error={consulta.error} reintentar={consulta.recargar} />
      {consulta.cargando ? (
        <Cargando />
      ) : (
        consulta.datos && (
          <>
            {!consulta.datos.total && (
              <p>No hay responsables registrados en esta ficha.</p>
            )}
            {consulta.datos.datos.map((r) => (
              <div key={r.id} className="grid">
                <span>
                  <strong>{r.nombre}</strong> · {r.relacion}
                </span>
                <span>
                  DPI/CUI: {r.cui} · Teléfono: {r.telefono}
                </span>
                {editable && (
                  <button
                    type="button"
                    disabled={busy || dirty}
                    onClick={() => editar(r)}
                  >
                    Editar {r.nombre}
                  </button>
                )}
              </div>
            ))}
            <Paginacion
              {...consulta.datos}
              cambiar={(page) => {
                if (!dirty && !busy) setPagina(page);
              }}
            />
          </>
        )
      )}
      <ErrorVista error={error} />
      {blocked && (
        <p>
          Conservamos lo escrito. Consulta la ficha vigente antes de intentar
          otro guardado.
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {editable && (
        <form onSubmit={(event) => void guardar(event)}>
          <fieldset disabled={busy || blocked} className="grid">
            <legend>
              {id ? "Corregir responsable" : "Agregar responsable"}
            </legend>
            {campos.map(([campo, label, max]) => (
              <label key={campo}>
                {label}
                <input
                  required
                  maxLength={max}
                  value={datos[campo]}
                  onChange={(e) => {
                    setDatos((current) => ({
                      ...current,
                      [campo]: e.target.value,
                    }));
                    setDirty(true);
                    setMessage("");
                  }}
                  aria-invalid={
                    error instanceof ApiError &&
                    error.body.errores.some((e) => e.campo === campo)
                  }
                />
              </label>
            ))}
            {id && (
              <label className="full">
                Motivo de la corrección
                <input
                  required
                  maxLength={2000}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </label>
            )}
          </fieldset>
          <div className="actions">
            <button type="submit" disabled={busy || blocked || !dirty}>
              Guardar responsable
            </button>
            <button type="button" disabled={busy} onClick={cancelar}>
              Cancelar captura
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
