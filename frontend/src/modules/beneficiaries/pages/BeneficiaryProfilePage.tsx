import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { changeBeneficiaryStatus, getBeneficiary, getBeneficiaryHistory, listBeneficiaryChildren } from "../api/beneficiaries-api";
import { BeneficiaryEditForm } from "../components/BeneficiaryEditForm";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

function displayDate(value?: string | null) {
  if (!value) return "No registrada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function displayDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Guatemala" }).format(date);
}

function yesNoUnknown(value?: boolean | null) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "No registrado";
}

export function BeneficiaryProfilePage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"summary" | "history" | "family">("summary");
  const [editing, setEditing] = useState(false);
  const [showStateForm, setShowStateForm] = useState(false);
  const [stateReason, setStateReason] = useState("");
  const [localError, setLocalError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const beneficiaryQuery = useQuery({ queryKey: ["beneficiary", id], queryFn: ({ signal }) => getBeneficiary(id, signal), enabled: !!id });
  const childrenQuery = useQuery({ queryKey: ["beneficiary", id, "children"], queryFn: ({ signal }) => listBeneficiaryChildren(id, signal), enabled: !!id && activeTab === "family" });
  const historyQuery = useQuery({ queryKey: ["beneficiary", id, "history"], queryFn: ({ signal }) => getBeneficiaryHistory(id, signal), enabled: !!id && activeTab === "history" });
  const beneficiary = beneficiaryQuery.data;
  const statusMutation = useMutation({
    mutationFn: async () => {
      if (!beneficiary?.expediente) throw new Error("El expediente no está disponible.");
      return changeBeneficiaryStatus(id, !beneficiary.expediente.activo, beneficiary.expediente.version, stateReason.trim());
    },
    onSuccess: async () => {
      setNotice(beneficiary?.expediente?.activo ? "Expediente inactivado correctamente." : "Expediente reactivado correctamente.");
      setShowStateForm(false);
      setStateReason("");
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["beneficiary", id] }), queryClient.invalidateQueries({ queryKey: ["beneficiary", id, "history"] })]);
    },
  });

  const error = beneficiaryQuery.error instanceof ApiError ? beneficiaryQuery.error.body : undefined;
  if (beneficiaryQuery.isLoading) return <p className="status-message" role="status">Cargando expediente…</p>;
  if (error || !beneficiary) return <section><PageHeader title="Expediente de beneficiaria" description="No fue posible recuperar la información solicitada." /><div className="alert error" role="alert"><strong>{error?.mensaje ?? "El expediente no está disponible."}</strong></div><Link className="button secondary" to="/beneficiarias">Volver al listado</Link></section>;

  const ficha = beneficiary.fichaInicial;
  const childrenError = childrenQuery.error instanceof ApiError ? childrenQuery.error.body : undefined;
  const historyError = historyQuery.error instanceof ApiError ? historyQuery.error.body : undefined;
  const statusError = statusMutation.error instanceof ApiError ? statusMutation.error.body : undefined;

  function submitStateChange(event: FormEvent) {
    event.preventDefault();
    if (stateReason.trim().length < 3) return setLocalError("Escribe un motivo de al menos 3 caracteres.");
    setLocalError(undefined);
    statusMutation.mutate();
  }

  return <section>
    <PageHeader title={beneficiary.nombre} description="Consulta general del expediente. Los datos sensibles se muestran de forma minimizada." action={<div className="header-actions"><Link className="button secondary" to="/beneficiarias">Volver</Link><button className="button secondary" type="button" onClick={() => { setEditing((value) => !value); setShowStateForm(false); }}>{editing ? "Cerrar edición" : "Editar perfil"}</button>{beneficiary.expediente && <button className={`button ${beneficiary.expediente.activo ? "danger" : "primary"}`} type="button" onClick={() => { setShowStateForm((value) => !value); setEditing(false); }}>{beneficiary.expediente.activo ? "Inactivar expediente" : "Reactivar expediente"}</button>}</div>} />
    {notice && <div className="alert success" role="status">{notice}</div>}
    {editing && <BeneficiaryEditForm beneficiary={beneficiary} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); setNotice("Perfil actualizado correctamente."); }} />}
    {showStateForm && beneficiary.expediente && <form className="alert warning state-change-form" onSubmit={submitStateChange}><strong>{beneficiary.expediente.activo ? "Inactivar expediente" : "Reactivar expediente"}</strong><span>La información se conserva y la operación queda en el historial.</span><label htmlFor="state-reason">Motivo</label><textarea id="state-reason" value={stateReason} onChange={(event) => setStateReason(event.target.value)} />{(localError || statusError) && <span className="field-error">{localError ?? statusError?.mensaje}</span>}<div className="warning-actions"><button className="button secondary" type="button" onClick={() => setShowStateForm(false)}>Cancelar</button><button className={`button ${beneficiary.expediente.activo ? "danger" : "primary"}`} type="submit" disabled={statusMutation.isPending}>{statusMutation.isPending ? "Procesando…" : beneficiary.expediente.activo ? "Confirmar inactivación" : "Confirmar reactivación"}</button></div></form>}

    <nav className="profile-tabs" aria-label="Secciones del expediente"><button className={activeTab === "summary" ? "active" : ""} type="button" onClick={() => setActiveTab("summary")}>Resumen</button><button className={activeTab === "history" ? "active" : ""} type="button" onClick={() => setActiveTab("history")}>Historial</button><button className={activeTab === "family" ? "active" : ""} type="button" onClick={() => setActiveTab("family")}>Hijas e hijos</button></nav>

    {activeTab === "summary" && <div className="profile-summary">
      <article className="panel profile-card"><div className="card-heading"><div><h2>Datos generales</h2><p>Información de identificación autorizada.</p></div><span className={`status ${beneficiary.expediente?.activo === false ? "inactive" : "active"}`}>{beneficiary.expediente?.activo === false ? "Expediente inactivo" : "Expediente activo"}</span></div><dl className="detail-grid"><div><dt>Nombre completo</dt><dd>{beneficiary.nombre}</dd></div><div><dt>DPI/CUI</dt><dd>{beneficiary.cuiEnmascarado ?? "No registrado"}</dd></div><div><dt>Fecha de nacimiento</dt><dd>{displayDate(beneficiary.fechaNacimiento)}</dd></div><div><dt>Alfabetismo</dt><dd>{yesNoUnknown(beneficiary.alfabetismo)}</dd></div><div><dt>Enfermedad permanente</dt><dd>{yesNoUnknown(beneficiary.enfermedadPermanente)}</dd></div><div><dt>Enfermedad</dt><dd>{beneficiary.nombreEnfermedad ?? "No registrada"}</dd></div></dl></article>
      <article className="panel profile-card"><div className="card-heading"><div><h2>Ficha inicial</h2><p>Estado del proceso de admisión.</p></div>{ficha && <span className={`status ${ficha.estado === "BORRADOR" ? "draft" : "active"}`}>{ficha.estado === "BORRADOR" ? "Borrador" : "Confirmada"}</span>}</div>{ficha ? <><dl className="detail-grid"><div><dt>Correlativo</dt><dd>{ficha.correlativo ?? "Pendiente"}</dd></div><div><dt>Fecha</dt><dd>{displayDate(ficha.fecha)}</dd></div><div className="full"><dt>Lugar</dt><dd>{ficha.lugar ?? "No registrado"}</dd></div></dl><div className="card-actions"><Link className="button primary" to={`/fichas/${ficha.id}`}>{ficha.estado === "BORRADOR" ? "Continuar ficha inicial" : "Consultar ficha inicial"}</Link></div></> : <p className="muted-message">Este expediente todavía no tiene ficha inicial.</p>}</article>
      <article className="panel profile-card"><div className="card-heading"><div><h2>Residencia</h2><p>Ubicación y contacto.</p></div></div><dl className="detail-grid"><div className="full"><dt>Dirección</dt><dd>{beneficiary.residencia?.direccionActual ?? "No registrada"}</dd></div><div><dt>Celular</dt><dd>{beneficiary.residencia?.telefonoCelular ?? "No registrado"}</dd></div><div><dt>Área</dt><dd>{beneficiary.residencia?.urbano == null ? "No registrada" : beneficiary.residencia.urbano ? "Urbana" : "Rural"}</dd></div><div><dt>Persona enlace</dt><dd>{beneficiary.residencia?.personaEnlace ?? "No registrada"}</dd></div><div><dt>Relación</dt><dd>{beneficiary.residencia?.relacionPersonaEnlace ?? "No registrada"}</dd></div></dl></article>
      <article className="panel profile-card"><div className="card-heading"><div><h2>Trabajo o estudio</h2><p>Lugar de ocupación.</p></div></div><dl className="detail-grid"><div><dt>Nombre</dt><dd>{beneficiary.lugarOcupacion?.nombre ?? "No registrado"}</dd></div><div><dt>Teléfono</dt><dd>{beneficiary.lugarOcupacion?.telefono ?? "No registrado"}</dd></div><div className="full"><dt>Dirección</dt><dd>{beneficiary.lugarOcupacion?.direccion ?? "No registrada"}</dd></div><div><dt>Contacto</dt><dd>{beneficiary.lugarOcupacion?.personaContacto ?? "No registrado"}</dd></div><div><dt>Cargo</dt><dd>{beneficiary.lugarOcupacion?.cargoPersonaContacto ?? "No registrado"}</dd></div></dl></article>
    </div>}

    {activeTab === "history" && <article className="panel profile-card"><div className="card-heading"><div><h2>Historial de modificaciones</h2><p>Operaciones auditadas sobre la beneficiaria y el expediente.</p></div></div>{historyQuery.isLoading && <p className="status-message" role="status">Cargando historial…</p>}{historyError && <div className="alert error" role="alert"><strong>{historyError.mensaje}</strong></div>}{historyQuery.data?.data.length === 0 && <p className="muted-message">Todavía no hay modificaciones registradas.</p>}{!!historyQuery.data?.data.length && <div className="timeline">{historyQuery.data.data.map((item) => <div className="event" key={item.id}><h3>{item.operacion} · {item.recurso}</h3><p>{item.motivo ?? "Sin motivo disponible"}</p><time>{displayDateTime(item.registradoEn)}</time></div>)}</div>}</article>}

    {activeTab === "family" && <article className="panel profile-card children-card"><div className="card-heading"><div><h2>Hijas e hijos vinculados</h2><p>Registros asociados al expediente.</p></div>{childrenQuery.data && <span className="count-badge">{childrenQuery.data.data.length}</span>}</div>{childrenQuery.isLoading && <p className="status-message" role="status">Cargando registros…</p>}{childrenError && <div className="alert error" role="alert"><strong>{childrenError.mensaje}</strong></div>}{childrenQuery.data?.data.length === 0 && <p className="muted-message">No hay hijas o hijos registrados.</p>}{!!childrenQuery.data?.data.length && <div className="table-panel"><table><thead><tr><th>Nombre</th><th>DPI/CUI</th><th>Nacimiento</th><th>Género</th><th>Reconocimiento</th><th>Estado</th></tr></thead><tbody>{childrenQuery.data.data.map((child) => <tr key={child.id}><td>{child.nombre}</td><td>{child.cuiEnmascarado ?? "No registrado"}</td><td>{displayDate(child.fechaNacimiento)}</td><td>{child.genero ?? "No registrado"}</td><td>{yesNoUnknown(child.reconocido)}</td><td><span className={`status ${child.activo ? "active" : "inactive"}`}>{child.activo ? "Activo" : "Inactivo"}</span></td></tr>)}</tbody></table></div>}</article>}
  </section>;
}
