import { ApiError } from "../api/http";
export function ErrorVista({
  error,
  reintentar,
}: {
  error: unknown;
  reintentar?: () => void;
}) {
  if (!error) return null;
  const e = error instanceof ApiError ? error : null;
  return (
    <div role="alert" className="alert error">
      <strong>
        {e?.estado === 409
          ? "La información cambió. Recarga la versión vigente antes de guardar."
          : e?.message || "No se pudo completar la operación."}
      </strong>
      {e?.errores.map((x, i) => (
        <p key={i}>
          {x.campo}: {x.mensaje}
        </p>
      ))}
      {e?.idSolicitud && <small>Solicitud: {e.idSolicitud}</small>}
      {reintentar && <button onClick={reintentar}>Volver a intentar</button>}
    </div>
  );
}
export function Cargando() {
  return (
    <p role="status" className="empty">
      Cargando información…
    </p>
  );
}
export function Paginacion({
  pagina,
  total,
  limite,
  cambiar,
}: {
  pagina: number;
  total: number;
  limite: number;
  cambiar: (n: number) => void;
}) {
  return (
    <nav aria-label="Paginación" className="actions">
      <button disabled={pagina === 1} onClick={() => cambiar(pagina - 1)}>
        Anterior
      </button>
      <span>
        Página {pagina} · {total} registros
      </span>
      <button
        disabled={pagina * limite >= total}
        onClick={() => cambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
export function valor(v: unknown): string {
  return typeof v === "boolean"
    ? v
      ? "Sí"
      : "No"
    : v == null
      ? "Sin registrar"
      : typeof v === "object"
        ? JSON.stringify(v)
        : String(v);
}
export function fecha(v: string) {
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Guatemala",
  }).format(new Date(v));
}

export function fechaInput(valor?: string) {
  const d = valor ? new Date(valor) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function estadoTexto(codigo?: string) {
  return !codigo
    ? "Borrador nuevo"
    : codigo.includes("BORRADOR")
      ? "Borrador"
      : codigo.includes("CONFIRMADO")
        ? "Confirmada"
        : codigo === "CERRADA"
          ? "Cerrada"
          : codigo;
}
