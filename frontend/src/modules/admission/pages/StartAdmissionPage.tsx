import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { startAdmission } from "../api/admission-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

const schema = z.object({
  nombre: z.string().trim().min(2, "Escribe al menos 2 caracteres.").max(60),
  cui: z.string().trim().refine((value) => value === "" || value.length >= 4, "Escribe al menos 4 caracteres."),
  fechaNacimiento: z.string(),
  lugar: z.string().trim().refine((value) => value === "" || value.length >= 2, "Escribe al menos 2 caracteres."),
  fechaEntrevista: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function StartAdmissionPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", cui: "", fechaNacimiento: "", lugar: "", fechaEntrevista: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      startAdmission(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "")) as FormValues),
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error.body : undefined;

  return (
    <section>
      <PageHeader
        title="Iniciar ficha inicial"
        description="Crea el borrador de admisión, la beneficiaria y su expediente en una sola operación."
      />
      <div className="step-indicator" aria-label="Progreso de la ficha">
        <strong>Paso 1 de 8</strong><span>Identificación</span>
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
        {mutation.isSuccess && (
          <div className="alert success" role="status">
            <strong>Borrador creado correctamente.</strong>
            <span>Ficha {mutation.data.data.fichaInicial.id}, versión {mutation.data.data.fichaInicial.version}.</span>
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
