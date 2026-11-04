import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  confirmAdmission,
  getAdmission,
  saveAdmissionPage,
  type ChildDraft,
} from "../api/admission-api";
import {
  admissionPages,
  requiredSectionKeys,
} from "../config/admission-pages";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

type SectionValues = Record<string, Record<string, unknown>>;

function contentIsPresent(value: Record<string, unknown> | undefined) {
  return !!value && Object.values(value).some((item) =>
    typeof item === "string" ? item.trim().length > 0 : item !== undefined,
  );
}

export function AdmissionWizardPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<SectionValues>({});
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [notice, setNotice] = useState<string>();

  const admissionQuery = useQuery({
    queryKey: ["admission", id],
    queryFn: ({ signal }) => getAdmission(id, signal),
    enabled: /^\d+$/.test(id),
  });

  useEffect(() => {
    if (!admissionQuery.data) return;
    setValues(Object.fromEntries(
      admissionQuery.data.data.secciones.map((section) => [
        section.seccion,
        section.contenido,
      ]),
    ));
  }, [admissionQuery.data]);

  const record = admissionQuery.data?.data;
  const page = admissionPages[activeIndex];
  const completedSections = useMemo(
    () => new Set(Object.entries(values).filter(([, value]) => contentIsPresent(value)).map(([key]) => key)),
    [values],
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!record) throw new Error("La ficha no está disponible.");
      const sections = Object.fromEntries(page.sections.map((section) => [
        section.key,
        values[section.key] ?? {},
      ]));
      return saveAdmissionPage(id, page.key, {
        secciones: sections,
        ...(page.key === "familia" && { hijos: children }),
        versionFicha: record.version,
        motivo: `Guardado de borrador: ${page.title}`,
      });
    },
    onSuccess: async () => {
      setNotice("Página guardada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["admission", id] });
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!record) throw new Error("La ficha no está disponible.");
      return confirmAdmission(id, record.version);
    },
    onSuccess: async () => {
      setNotice("Ficha confirmada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["admission", id] });
    },
  });

  const mutationError = saveMutation.error ?? confirmMutation.error;
  const apiError = mutationError instanceof ApiError ? mutationError.body : undefined;

  function updateField(section: string, field: string, value: string) {
    setNotice(undefined);
    setValues((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  function addChild() {
    setChildren((current) => [...current, { nombre: "" }]);
  }

  function updateChild(index: number, field: keyof ChildDraft, value: string | boolean) {
    setChildren((current) => current.map((child, childIndex) =>
      childIndex === index ? { ...child, [field]: value } : child,
    ));
  }

  if (!/^\d+$/.test(id)) {
    return <div className="alert error" role="alert">El identificador de ficha no es válido.</div>;
  }

  if (admissionQuery.isLoading) {
    return <p className="status-message" role="status">Recuperando borrador…</p>;
  }

  if (admissionQuery.isError || !record) {
    return (
      <div className="alert error" role="alert">
        <strong>No fue posible recuperar la ficha.</strong>
        <Link to="/beneficiarias">Volver a Beneficiarias</Link>
      </div>
    );
  }

  const isConfirmed = record.estado === "CONFIRMADA";
  const missingSections = requiredSectionKeys.filter((key) => !completedSections.has(key));

  return (
    <section>
      <PageHeader
        title="Ficha inicial"
        description={`Borrador ${record.correlativo ?? `#${record.id}`} · versión ${record.version}`}
        action={<span className={`status ${isConfirmed ? "active" : "draft"}`}>{isConfirmed ? "Confirmada" : "Borrador"}</span>}
      />

      <div className="wizard-layout">
        <nav className="wizard-nav" aria-label="Páginas de la ficha inicial">
          {admissionPages.map((item, index) => {
            const complete = item.sections.every((section) => completedSections.has(section.key));
            return (
              <button
                key={item.key}
                type="button"
                className={`wizard-step${index === activeIndex ? " current" : ""}`}
                onClick={() => { setActiveIndex(index); setNotice(undefined); }}
              >
                <span>{index + 1}</span>
                <span>{item.shortTitle}<small>{complete ? "Guardada" : "Pendiente"}</small></span>
              </button>
            );
          })}
        </nav>

        <div className="wizard-content">
          <div className="step-indicator">
            <strong>Paso {activeIndex + 1} de {admissionPages.length}</strong>
            <span>{page.title}</span>
          </div>

          {apiError && (
            <div className="alert error" role="alert">
              <strong>{apiError.mensaje}</strong>
              {apiError.errores.map((item) => <span key={`${item.campo}-${item.mensaje}`}>{item.mensaje}</span>)}
              <small>Solicitud: {apiError.idSolicitud}</small>
            </div>
          )}
          {notice && <div className="alert success" role="status">{notice}</div>}

          {page.sections.map((section) => (
            <fieldset className="panel form-panel section-panel" key={section.key} disabled={isConfirmed}>
              <legend>{section.title}</legend>
              {section.description && <p className="section-description">{section.description}</p>}
              <div className="form-grid">
                {section.fields.map((field) => (
                  <div className={`field${field.type === "textarea" ? " full" : ""}`} key={field.name}>
                    <label htmlFor={`${section.key}-${field.name}`}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={`${section.key}-${field.name}`}
                        value={String(values[section.key]?.[field.name] ?? "")}
                        onChange={(event) => updateField(section.key, field.name, event.target.value)}
                        rows={4}
                      />
                    ) : (
                      <input
                        id={`${section.key}-${field.name}`}
                        type={field.type ?? "text"}
                        value={String(values[section.key]?.[field.name] ?? "")}
                        onChange={(event) => updateField(section.key, field.name, event.target.value)}
                      />
                    )}
                    {field.hint && <small>{field.hint}</small>}
                  </div>
                ))}
              </div>
            </fieldset>
          ))}

          {page.key === "familia" && (
            <fieldset className="panel form-panel section-panel" disabled={isConfirmed}>
              <legend>Hijas e hijos</legend>
              {children.map((child, index) => (
                <div className="child-row" key={index}>
                  <div className="field">
                    <label htmlFor={`child-name-${index}`}>Nombre</label>
                    <input id={`child-name-${index}`} value={child.nombre ?? ""} onChange={(event) => updateChild(index, "nombre", event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`child-birth-${index}`}>Fecha de nacimiento</label>
                    <input id={`child-birth-${index}`} type="date" value={child.fechaNacimiento ?? ""} onChange={(event) => updateChild(index, "fechaNacimiento", event.target.value)} />
                  </div>
                  <button className="button text" type="button" onClick={() => setChildren((current) => current.filter((_, childIndex) => childIndex !== index))}>Quitar</button>
                </div>
              ))}
              <button className="button secondary" type="button" onClick={addChild}>Agregar hija o hijo</button>
            </fieldset>
          )}

          {!isConfirmed && (
            <div className="form-actions wizard-actions">
              <button className="button secondary" type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((current) => current - 1)}>Anterior</button>
              <button className="button primary" type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? "Guardando…" : "Guardar página"}</button>
              {activeIndex < admissionPages.length - 1 ? (
                <button className="button secondary" type="button" onClick={() => setActiveIndex((current) => current + 1)}>Siguiente</button>
              ) : (
                <button className="button primary" type="button" disabled={confirmMutation.isPending || missingSections.length > 0} onClick={() => confirmMutation.mutate()}>
                  {confirmMutation.isPending ? "Confirmando…" : "Confirmar ficha"}
                </button>
              )}
            </div>
          )}

          {!isConfirmed && activeIndex === admissionPages.length - 1 && missingSections.length > 0 && (
            <p className="completion-note">Faltan {missingSections.length} secciones por guardar antes de confirmar.</p>
          )}
        </div>
      </div>
    </section>
  );
}
