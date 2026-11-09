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

function valueIsPresent(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(valueIsPresent);
  if (value && typeof value === "object") return Object.values(value).some(valueIsPresent);
  return value !== undefined && value !== null;
}

function contentIsPresent(value: Record<string, unknown> | undefined) {
  return !!value && Object.values(value).some(valueIsPresent);
}

export function AdmissionWizardPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const [values, setValues] = useState<SectionValues>({});
  const [savedValues, setSavedValues] = useState<SectionValues>({});
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [savedChildren, setSavedChildren] = useState<ChildDraft[]>([]);
  const [notice, setNotice] = useState<string>();
  const [showDiscardWarning, setShowDiscardWarning] = useState(false);
  const [incompleteSectionKeys, setIncompleteSectionKeys] = useState<string[]>([]);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [childNameErrors, setChildNameErrors] = useState<number[]>([]);
  const [childCuiErrors, setChildCuiErrors] = useState<number[]>([]);

  const admissionQuery = useQuery({
    queryKey: ["admission", id],
    queryFn: ({ signal }) => getAdmission(id, signal),
    enabled: /^\d+$/.test(id),
  });

  useEffect(() => {
    if (!admissionQuery.data) return;
    const fetchedValues = Object.fromEntries(
      admissionQuery.data.data.secciones.map((section) => [
        section.seccion,
        section.contenido,
      ]),
    );
    setValues(fetchedValues);
    setSavedValues(fetchedValues);
    const firstPendingPage = admissionPages.findIndex((item) =>
      item.sections.some((section) => !fetchedValues[section.key] || !contentIsPresent(fetchedValues[section.key])),
    );
    setMaxReachedIndex(firstPendingPage === -1 ? admissionPages.length - 1 : firstPendingPage);
  }, [admissionQuery.data]);

  const record = admissionQuery.data?.data;
  const page = admissionPages[activeIndex];
  const completedSections = useMemo(
    () => new Set(Object.entries(values).filter(([, value]) => contentIsPresent(value)).map(([key]) => key)),
    [values],
  );
  const savedSectionKeys = useMemo(
    () => new Set(record?.secciones.map((section) => section.seccion) ?? []),
    [record?.secciones],
  );
  const pageWasSaved = page.sections.every((section) => savedSectionKeys.has(section.key));
  const pageIsDirty = page.sections.some((section) =>
    JSON.stringify(values[section.key] ?? {}) !== JSON.stringify(savedValues[section.key] ?? {}),
  ) || (page.key === "familia" && JSON.stringify(children) !== JSON.stringify(savedChildren));

  function pagePayload() {
    if (!record) throw new Error("La ficha no está disponible.");
    return {
      secciones: Object.fromEntries(page.sections.map((section) => [
        section.key,
        values[section.key] ?? {},
      ])),
      ...(page.key === "familia" && { hijos: children }),
      versionFicha: record.version,
      motivo: pageWasSaved
        ? `Actualización de página: ${page.title}`
        : `Guardado inicial de página: ${page.title}`,
    };
  }

  const saveMutation = useMutation({
    mutationFn: ({ advance }: { advance: boolean }) =>
      saveAdmissionPage(id, page.key, pagePayload()).then((response) => ({ response, advance })),
    onSuccess: async ({ response, advance }) => {
      const savedPageValues = Object.fromEntries(page.sections.map((section) => [
        section.key,
        values[section.key] ?? {},
      ]));
      setSavedValues((current) => ({ ...current, ...savedPageValues }));
      if (page.key === "familia") {
        setChildren(response.data.hijos);
        setSavedChildren(response.data.hijos);
      }
      setNotice(advance ? "Página guardada. Puedes continuar." : "Página actualizada correctamente.");
      setShowDiscardWarning(false);
      await queryClient.invalidateQueries({ queryKey: ["admission", id] });
      if (advance) {
        setActiveIndex((current) => {
          const next = Math.min(current + 1, admissionPages.length - 1);
          setMaxReachedIndex((reached) => Math.max(reached, next));
          return next;
        });
      }
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!record) throw new Error("La ficha no está disponible.");
      let version = record.version;
      if (!pageWasSaved || pageIsDirty) {
        const saved = await saveAdmissionPage(id, page.key, pagePayload());
        version = saved.data.version;
      }
      return confirmAdmission(id, version);
    },
    onSuccess: async () => {
      setNotice("Ficha confirmada correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["admission", id] });
    },
  });

  const mutationError = saveMutation.error ?? confirmMutation.error;
  const apiError = mutationError instanceof ApiError ? mutationError.body : undefined;

  function updateField(section: string, field: string, value: unknown) {
    setNotice(undefined);
    setShowDiscardWarning(false);
    setIncompleteSectionKeys((current) => current.filter((key) => key !== section));
    setValues((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }));
  }

  function toggleFieldOption(section: string, field: string, option: string) {
    const current = values[section]?.[field];
    const selected = Array.isArray(current) ? current.filter((item): item is string => typeof item === "string") : [];
    updateField(
      section,
      field,
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  }

  function aggressors() {
    const repeated = values.agresores?.personas;
    if (Array.isArray(repeated)) return repeated.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
    const legacy = values.agresores ?? {};
    return contentIsPresent(legacy) ? [legacy] : [];
  }

  function addAggressor() {
    updateField("agresores", "personas", [...aggressors(), {}]);
  }

  function updateAggressor(index: number, field: string, value: string) {
    const next = aggressors().map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item);
    setNotice(undefined);
    setShowDiscardWarning(false);
    setIncompleteSectionKeys((current) => current.filter((key) => key !== "agresores"));
    setValues((current) => ({ ...current, agresores: { personas: next } }));
  }

  function removeAggressor(index: number) {
    setValues((current) => ({ ...current, agresores: { personas: aggressors().filter((_, itemIndex) => itemIndex !== index) } }));
    setShowDiscardWarning(false);
  }

  function addChild() {
    setChildren((current) => [...current, { nombre: "" }]);
  }

  function removeChild(index: number) {
    setShowDiscardWarning(false);
    setChildren((current) => current.filter((_, childIndex) => childIndex !== index));
    setChildNameErrors((current) => current.flatMap((item) => item === index ? [] : [item > index ? item - 1 : item]));
    setChildCuiErrors((current) => current.flatMap((item) => item === index ? [] : [item > index ? item - 1 : item]));
  }

  function updateChild(index: number, field: keyof ChildDraft, value: string | boolean | undefined) {
    setShowDiscardWarning(false);
    if (field === "nombre") setChildNameErrors((current) => current.filter((item) => item !== index));
    if (field === "cui") setChildCuiErrors((current) => current.filter((item) => item !== index));
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
  const currentSectionKeys = new Set(page.sections.map((section) => section.key));
  const missingOutsideCurrentPage = missingSections.filter((key) => !currentSectionKeys.has(key));

  function fieldIsVisible(sectionKey: string, field: (typeof page.sections)[number]["fields"][number]) {
    if (!field.showWhen) return true;
    const controllingValue = values[sectionKey]?.[field.showWhen.field];
    if (field.showWhen.includes) return Array.isArray(controllingValue) && controllingValue.includes(field.showWhen.includes);
    return controllingValue === field.showWhen.equals;
  }

  function validateCurrentPage() {
    const incomplete = page.sections
      .filter((section) => !contentIsPresent(values[section.key]))
      .map((section) => section.key);
    const invalidChildren = page.key === "familia"
      ? children.flatMap((child, index) => {
        const length = child.nombre?.trim().length ?? 0;
        return length >= 2 && length <= 60 ? [] : [index];
      })
      : [];
    const invalidChildCuis = page.key === "familia"
      ? children.flatMap((child, index) => {
        const length = child.cui?.trim().length ?? 0;
        return length === 0 || (length >= 4 && length <= 20) ? [] : [index];
      })
      : [];
    setIncompleteSectionKeys(incomplete);
    setChildNameErrors(invalidChildren);
    setChildCuiErrors(invalidChildCuis);
    if (incomplete.length === 0 && invalidChildren.length === 0 && invalidChildCuis.length === 0) return true;
    setNotice(undefined);
    setShowDiscardWarning(false);
    requestAnimationFrame(() => {
      const targetId = incomplete.length > 0
        ? `${incomplete[0]}-title`
        : invalidChildren.length > 0 ? `child-name-${invalidChildren[0]}` : `child-cui-${invalidChildCuis[0]}`;
      document.getElementById(targetId)?.focus();
    });
    return false;
  }

  function goForward() {
    if (!validateCurrentPage()) return;
    if (!pageWasSaved) {
      saveMutation.mutate({ advance: true });
      return;
    }
    if (pageIsDirty) {
      setShowDiscardWarning(true);
      return;
    }
    setActiveIndex((current) => Math.min(current + 1, admissionPages.length - 1));
  }

  function updateCurrentPage() {
    if (validateCurrentPage()) saveMutation.mutate({ advance: false });
  }

  function confirmCurrentAdmission() {
    if (validateCurrentPage()) confirmMutation.mutate();
  }

  function discardChangesAndContinue() {
    setValues((current) => ({
      ...current,
      ...Object.fromEntries(page.sections.map((section) => [section.key, savedValues[section.key] ?? {}])),
    }));
    if (page.key === "familia") setChildren(savedChildren);
    setShowDiscardWarning(false);
    setActiveIndex((current) => Math.min(current + 1, admissionPages.length - 1));
  }

  return (
    <section>
      <PageHeader
        title="Ficha inicial"
        description={`${isConfirmed ? "Ficha confirmada" : "Borrador"} ${record.correlativo ?? `#${record.id}`} · versión ${record.version}`}
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
                disabled={index > maxReachedIndex}
                onClick={() => { setActiveIndex(index); setNotice(undefined); setIncompleteSectionKeys([]); }}
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
          {incompleteSectionKeys.length > 0 && (
            <div className="alert error" role="alert">
              <strong>Completa la página antes de continuar.</strong>
              <span>Revisa las secciones y los registros familiares señalados.</span>
            </div>
          )}
          {showDiscardWarning && (
            <div className="alert warning unsaved-warning" role="alert">
              <strong>Los cambios de esta página todavía no están actualizados.</strong>
              <span>Si continúas, se descartarán y se conservará la última versión guardada.</span>
              <div className="warning-actions">
                <button className="button secondary" type="button" onClick={() => setShowDiscardWarning(false)}>Volver y actualizar</button>
                <button className="button text" type="button" onClick={discardChangesAndContinue}>Continuar sin guardar</button>
              </div>
            </div>
          )}

          {page.sections.map((section) => (
            <fieldset className="panel form-panel section-panel" key={section.key} disabled={isConfirmed} aria-labelledby={`${section.key}-title`}>
              <div className="section-panel-title" id={`${section.key}-title`} role="heading" aria-level={2} tabIndex={-1}>{section.title}</div>
              {incompleteSectionKeys.includes(section.key) && (
                <p className="field-error">Ingresa al menos un dato en esta sección.</p>
              )}
              {section.description && <p className="section-description">{section.description}</p>}
              {section.key === "agresores" ? <div className="repeatable-list">
                {aggressors().map((aggressor, index) => <div className="repeatable-record" key={index}>
                  <div className="repeatable-heading"><h3>Persona agresora {index + 1}</h3><button className="button text" type="button" onClick={() => removeAggressor(index)}>Quitar</button></div>
                  <div className="form-grid">{section.fields.map((field) => <div className={`field${field.type === "textarea" ? " full" : ""}`} key={field.name}>
                    <label htmlFor={`aggressor-${index}-${field.name}`}>{field.label}</label>
                    {field.type === "textarea" ? <textarea id={`aggressor-${index}-${field.name}`} value={String(aggressor[field.name] ?? "")} onChange={(event) => updateAggressor(index, field.name, event.target.value)} /> : field.type === "select" ? <select id={`aggressor-${index}-${field.name}`} value={String(aggressor[field.name] ?? "")} onChange={(event) => updateAggressor(index, field.name, event.target.value)}><option value="">Seleccionar</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input id={`aggressor-${index}-${field.name}`} type={field.type ?? "text"} value={String(aggressor[field.name] ?? "")} onChange={(event) => updateAggressor(index, field.name, event.target.value)} />}
                  </div>)}</div>
                </div>)}
                <button className="button secondary" type="button" onClick={addAggressor}>Agregar persona agresora</button>
              </div> : <div className="form-grid">
                {section.fields.map((field) => (
                  fieldIsVisible(section.key, field) && <div className={`field${field.type === "textarea" ? " full" : ""}`} key={field.name}>
                    <label htmlFor={`${section.key}-${field.name}`}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={`${section.key}-${field.name}`}
                        value={String(values[section.key]?.[field.name] ?? "")}
                        onChange={(event) => updateField(section.key, field.name, event.target.value)}
                        rows={4}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={`${section.key}-${field.name}`}
                        value={String(values[section.key]?.[field.name] ?? "")}
                        onChange={(event) => updateField(section.key, field.name, event.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    ) : field.type === "checkboxGroup" ? (
                      <div className="checkbox-group" id={`${section.key}-${field.name}`}>
                        {field.options?.map((option) => {
                          const selected = values[section.key]?.[field.name];
                          return (
                            <label className="checkbox-choice" key={option.value}>
                              <input
                                type="checkbox"
                                checked={Array.isArray(selected) && selected.includes(option.value)}
                                onChange={() => toggleFieldOption(section.key, field.name, option.value)}
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
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
              </div>}
            </fieldset>
          ))}

          {page.key === "familia" && (
            <fieldset className="panel form-panel section-panel" disabled={isConfirmed} aria-labelledby="children-section-title">
              <div className="section-panel-title" id="children-section-title" role="heading" aria-level={2}>Hijas e hijos</div>
              {children.map((child, index) => (
                <div className="child-row" key={index}>
                  <div className="field">
                    <label htmlFor={`child-name-${index}`}>Nombre</label>
                    <input id={`child-name-${index}`} value={child.nombre ?? ""} aria-invalid={childNameErrors.includes(index)} onChange={(event) => updateChild(index, "nombre", event.target.value)} />
                    {childNameErrors.includes(index) && <small className="field-error">El nombre debe tener entre 2 y 60 caracteres.</small>}
                  </div>
                  <div className="field">
                    <label htmlFor={`child-cui-${index}`}>DPI/CUI</label>
                    <input id={`child-cui-${index}`} value={child.cui ?? ""} aria-invalid={childCuiErrors.includes(index)} onChange={(event) => updateChild(index, "cui", event.target.value)} />
                    {childCuiErrors.includes(index) && <small className="field-error">El DPI/CUI debe tener entre 4 y 20 caracteres.</small>}
                  </div>
                  <div className="field">
                    <label htmlFor={`child-birth-${index}`}>Fecha de nacimiento</label>
                    <input id={`child-birth-${index}`} type="date" value={child.fechaNacimiento ?? ""} onChange={(event) => updateChild(index, "fechaNacimiento", event.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor={`child-gender-${index}`}>Sexo</label>
                    <select id={`child-gender-${index}`} value={child.genero ?? ""} onChange={(event) => updateChild(index, "genero", event.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="F">Femenino</option>
                      <option value="M">Masculino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`child-recognized-${index}`}>Reconocimiento</label>
                    <select id={`child-recognized-${index}`} value={child.reconocido == null ? "" : String(child.reconocido)} onChange={(event) => updateChild(index, "reconocido", event.target.value === "" ? undefined : event.target.value === "true")}>
                      <option value="">Seleccionar</option>
                      <option value="true">Reconocida/o</option>
                      <option value="false">No reconocida/o</option>
                    </select>
                  </div>
                  <button className="button text" type="button" onClick={() => removeChild(index)}>Quitar</button>
                </div>
              ))}
              <button className="button secondary" type="button" onClick={addChild}>Agregar hija o hijo</button>
            </fieldset>
          )}

          {!isConfirmed && (
            <div className="form-actions wizard-actions">
              <button className="button secondary" type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((current) => current - 1)}>Anterior</button>
              {pageWasSaved && (
                <button className="button primary" type="button" disabled={saveMutation.isPending || !pageIsDirty} onClick={updateCurrentPage}>
                  {saveMutation.isPending ? "Actualizando…" : "Actualizar"}
                </button>
              )}
              {activeIndex < admissionPages.length - 1 ? (
                <button className="button primary" type="button" disabled={saveMutation.isPending} onClick={goForward}>
                  {saveMutation.isPending ? "Guardando…" : "Siguiente"}
                </button>
              ) : (
                <button className="button primary" type="button" disabled={confirmMutation.isPending || missingOutsideCurrentPage.length > 0} onClick={confirmCurrentAdmission}>
                  {confirmMutation.isPending ? "Guardando y confirmando…" : "Confirmar ficha"}
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
