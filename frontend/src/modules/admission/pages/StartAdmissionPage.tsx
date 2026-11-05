import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { startAdmission } from "../api/admission-api";
import { searchBeneficiaryMatches } from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { getCatalog, getCountries, getDepartments, getMunicipalities } from "@/shared/api/catalogs-api";
import { PageHeader } from "@/shared/components/PageHeader";

const schema = z.object({
  nombre: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(60),
  cui: z.string().trim().refine((value) => value === "" || value.length >= 4, "Escribe al menos 4 caracteres."),
  fechaNacimiento: z.string(),
  paisCuiId: z.string(),
  tipoAcompananteId: z.string(),
  paisOrigenId: z.string(),
  departamentoOrigenId: z.string(),
  municipioOrigenId: z.string(),
  lugar: z.string().trim().refine((value) => value === "" || value.length >= 2, "Escribe al menos 2 caracteres."),
  fechaEntrevista: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function StartAdmissionPage() {
  const navigate = useNavigate();
  const [showDuplicateSearch, setShowDuplicateSearch] = useState(false);
  const [duplicateCui, setDuplicateCui] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      cui: "",
      fechaNacimiento: "",
      paisCuiId: "",
      tipoAcompananteId: "",
      paisOrigenId: "",
      departamentoOrigenId: "",
      municipioOrigenId: "",
      lugar: "",
      fechaEntrevista: "",
    },
  });
  const countryId = form.watch("paisOrigenId");
  const departmentId = form.watch("departamentoOrigenId");
  const countriesQuery = useQuery({ queryKey: ["catalogs", "countries"], queryFn: ({ signal }) => getCountries(signal) });
  const companionTypesQuery = useQuery({ queryKey: ["catalogs", "tipos-acompanante"], queryFn: ({ signal }) => getCatalog("tipos-acompanante", signal) });
  const departmentsQuery = useQuery({
    queryKey: ["catalogs", "departments", countryId],
    queryFn: ({ signal }) => getDepartments(countryId, signal),
    enabled: !!countryId,
  });
  const municipalitiesQuery = useQuery({
    queryKey: ["catalogs", "municipalities", departmentId],
    queryFn: ({ signal }) => getMunicipalities(departmentId, signal),
    enabled: !!departmentId,
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      startAdmission(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "")) as FormValues),
    onSuccess: (response) => navigate(`/fichas/${response.data.fichaInicial.id}`),
  });
  const duplicateSearch = useMutation({
    mutationFn: (cui: string) => searchBeneficiaryMatches(cui.replace(/\D/g, "")),
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error.body : undefined;
  const duplicateError = duplicateSearch.error instanceof ApiError ? duplicateSearch.error.body : undefined;
  const normalizedDuplicateCui = duplicateCui.replace(/\D/g, "");

  return (
    <section>
      <PageHeader
        title="Iniciar ficha inicial"
        description="Crea el borrador de admisión, la beneficiaria y su expediente en una sola operación."
      />
      <div className="step-indicator" aria-label="Progreso de la ficha">
        <strong>Paso 1 de 8</strong><span>Identificación</span>
      </div>
      <div className="duplicate-search-wrapper">
        <button
          className="button secondary"
          type="button"
          aria-expanded={showDuplicateSearch}
          aria-controls="duplicate-search-panel"
          onClick={() => setShowDuplicateSearch((current) => !current)}
        >
          Buscar coincidencias existentes: Nombre o DPI/CUI
        </button>
        {showDuplicateSearch && (
          <section className="panel duplicate-search-panel" id="duplicate-search-panel" aria-labelledby="duplicate-search-title">
            <div className="section-heading">
              <h2 id="duplicate-search-title">Buscar por DPI/CUI</h2>
              <p>Comprueba si la beneficiaria ya tiene expediente antes de iniciar una ficha nueva.</p>
            </div>
            <form
              className="inline-search-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (normalizedDuplicateCui.length >= 4) duplicateSearch.mutate(normalizedDuplicateCui);
              }}
            >
              <div className="field">
                <label htmlFor="duplicate-cui">DPI/CUI</label>
                <input
                  id="duplicate-cui"
                  inputMode="numeric"
                  autoComplete="off"
                  value={duplicateCui}
                  onChange={(event) => {
                    setDuplicateCui(event.target.value);
                    duplicateSearch.reset();
                  }}
                  aria-describedby="duplicate-cui-helper"
                />
                <small id="duplicate-cui-helper">Puedes escribirlo con o sin espacios o guiones.</small>
                {duplicateCui && normalizedDuplicateCui.length < 4 && <span className="field-error">Escribe al menos 4 dígitos.</span>}
              </div>
              <button className="button primary" type="submit" disabled={duplicateSearch.isPending || normalizedDuplicateCui.length < 4}>
                {duplicateSearch.isPending ? "Buscando…" : "Buscar"}
              </button>
            </form>
            {duplicateError && <div className="alert error" role="alert"><strong>{duplicateError.mensaje}</strong></div>}
            {duplicateSearch.data?.data.length === 0 && (
              <div className="alert success" role="status"><strong>No se encontró un expediente con este DPI/CUI.</strong><span>Puedes continuar con el registro inicial.</span></div>
            )}
            {!!duplicateSearch.data?.data.length && (
              <div className="alert warning" role="alert">
                <strong>Ya existe una beneficiaria con este DPI/CUI.</strong>
                <span>Abre el expediente existente en lugar de crear un registro duplicado.</span>
                {duplicateSearch.data.data.map((match) => (
                  <Link className="button secondary" key={match.id} to={`/beneficiarias/${match.id}`}>Abrir expediente de {match.nombre}</Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      <form className="panel form-panel" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="section-heading">
          <h2>Datos iniciales</h2>
          <p>Los demás apartados se habilitarán después de crear el borrador.</p>
        </div>
        {apiError && (
          <div className="alert error" role="alert">
            <strong>{apiError.mensaje}</strong>
            {apiError.errores.map((item) => <span key={`${item.campo}-${item.mensaje}`}>{item.mensaje}</span>)}
            <small>Solicitud: {apiError.idSolicitud}</small>
          </div>
        )}
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="name">Nombre completo <span aria-hidden="true">*</span></label>
            <input id="name" {...form.register("nombre")} aria-invalid={!!form.formState.errors.nombre} />
            {form.formState.errors.nombre && <span className="field-error">{form.formState.errors.nombre.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="cui">DPI/CUI</label>
            <input id="cui" {...form.register("cui")} autoComplete="off" />
            {form.formState.errors.cui && <span className="field-error">{form.formState.errors.cui.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="birthDate">Fecha de nacimiento</label>
            <input id="birthDate" type="date" {...form.register("fechaNacimiento")} />
          </div>
          <div className="field">
            <label htmlFor="cuiCountry">País de emisión del DPI/CUI</label>
            <select id="cuiCountry" {...form.register("paisCuiId")}>
              <option value="">Seleccionar país</option>
              {countriesQuery.data?.data.map((option) => <option key={option.id} value={option.id}>{option.nombre ?? `País ${option.id}`}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="companionType">Tipo de acompañante</label>
            <select id="companionType" {...form.register("tipoAcompananteId")}>
              <option value="">Sin acompañante o pendiente</option>
              {companionTypesQuery.data?.data.map((option) => <option key={option.id} value={option.id}>{option.nombre ?? `Tipo ${option.id}`}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="originCountry">País de origen</label>
            <select
              id="originCountry"
              {...form.register("paisOrigenId", {
                onChange: () => {
                  form.setValue("departamentoOrigenId", "");
                  form.setValue("municipioOrigenId", "");
                },
              })}
            >
              <option value="">Seleccionar país</option>
              {countriesQuery.data?.data.map((option) => <option key={option.id} value={option.id}>{option.nombre ?? `País ${option.id}`}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="originDepartment">Departamento de origen</label>
            <select
              id="originDepartment"
              disabled={!countryId}
              {...form.register("departamentoOrigenId", { onChange: () => form.setValue("municipioOrigenId", "") })}
            >
              <option value="">Seleccionar departamento</option>
              {departmentsQuery.data?.data.map((option) => <option key={option.id} value={option.id}>{option.nombre ?? `Departamento ${option.id}`}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="originMunicipality">Municipio de origen</label>
            <select id="originMunicipality" disabled={!departmentId} {...form.register("municipioOrigenId")}>
              <option value="">Seleccionar municipio</option>
              {municipalitiesQuery.data?.data.map((option) => <option key={option.id} value={option.id}>{option.nombre ?? `Municipio ${option.id}`}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="place">Lugar de entrevista</label>
            <input id="place" {...form.register("lugar")} />
            {form.formState.errors.lugar && <span className="field-error">{form.formState.errors.lugar.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="interviewDate">Fecha de entrevista</label>
            <input id="interviewDate" type="date" {...form.register("fechaEntrevista")} />
          </div>
        </div>
        <div className="form-actions">
          <Link className="button secondary" to="/beneficiarias">Cancelar</Link>
          <button className="button primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creando borrador…" : "Crear borrador y continuar"}
          </button>
        </div>
      </form>
    </section>
  );
}
