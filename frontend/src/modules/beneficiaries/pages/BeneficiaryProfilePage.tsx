import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  createBeneficiaryChild,
  getBeneficiary,
  listBeneficiaryChildren,
} from "../api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";

function displayDate(value?: string | null) {
  if (!value) return "No registrada";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function yesNoUnknown(value?: boolean | null) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return "No registrado";
}

export function BeneficiaryProfilePage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [showChildForm, setShowChildForm] = useState(false);
  const [childForm, setChildForm] = useState({
    nombre: "",
    cui: "",
    fechaNacimiento: "",
    reconocido: "",
    genero: "",
  });
  const beneficiaryQuery = useQuery({
    queryKey: ["beneficiary", id],
    queryFn: ({ signal }) => getBeneficiary(id, signal),
    enabled: !!id,
  });
  const childrenQuery = useQuery({
    queryKey: ["beneficiary", id, "children"],
    queryFn: ({ signal }) => listBeneficiaryChildren(id, signal),
    enabled: !!id,
  });
  const error =
    beneficiaryQuery.error instanceof ApiError
      ? beneficiaryQuery.error.body
      : undefined;
  const beneficiary = beneficiaryQuery.data;
  const createChild = useMutation({
    mutationFn: () =>
      createBeneficiaryChild(id, {
        nombre: childForm.nombre.trim(),
        ...(childForm.cui && { cui: childForm.cui }),
        ...(childForm.fechaNacimiento && {
          fechaNacimiento: childForm.fechaNacimiento,
        }),
        ...(childForm.reconocido && {
          reconocido: childForm.reconocido === "true",
        }),
        ...(childForm.genero && {
          genero: childForm.genero as "F" | "M" | "O",
        }),
      }),
    onSuccess: async () => {
      setChildForm({
        nombre: "",
        cui: "",
        fechaNacimiento: "",
        reconocido: "",
        genero: "",
      });
      setShowChildForm(false);
      await queryClient.invalidateQueries({
        queryKey: ["beneficiary", id, "children"],
      });
    },
  });
  const createChildError =
    createChild.error instanceof ApiError ? createChild.error.body : undefined;

  if (beneficiaryQuery.isLoading)
    return (
      <p className="status-message" role="status">
        Cargando expediente…
      </p>
    );
  if (error || !beneficiary) {
    return (
      <section>
        <PageHeader
          title="Expediente de beneficiaria"
          description="No fue posible recuperar la información solicitada."
        />
        <div className="alert error" role="alert">
          <strong>
            {error?.mensaje ?? "El expediente no está disponible."}
          </strong>
          {error?.idSolicitud && <small>Solicitud: {error.idSolicitud}</small>}
        </div>
        <Link className="button secondary" to="/beneficiarias">
          Volver al listado
        </Link>
      </section>
    );
  }

  const ficha = beneficiary.fichaInicial;
  const childrenError =
    childrenQuery.error instanceof ApiError
      ? childrenQuery.error.body
      : undefined;
  return (
    <section>
      <PageHeader
        title={beneficiary.nombre}
        description="Consulta general del expediente. Los datos sensibles se muestran de forma minimizada."
        action={
          <Link className="button secondary" to="/beneficiarias">
            Volver al listado
          </Link>
        }
      />

      <nav className="profile-actions" aria-label="Áreas del expediente">
        <Link
          className="button secondary"
          to={`/beneficiarias/${id}/documentos`}
        >
          Documentos
        </Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/social`}>
          Trabajo Social
        </Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/legal`}>
          Legal
        </Link>
        <Link
          className="button secondary"
          to={`/beneficiarias/${id}/referencias`}
        >
          Referencias
        </Link>
        <Link
          className="button secondary"
          to={`/beneficiarias/${id}/guarderia`}
        >
          Guardería
        </Link>
        <Link
          className="button secondary"
          to={`/beneficiarias/${id}/evolucion`}
        >
          Evolución
        </Link>
      </nav>
      <div className="profile-summary">
        <article className="panel profile-card">
          <div className="card-heading">
            <div>
              <h2>Datos generales</h2>
              <p>Información de identificación autorizada.</p>
            </div>
            <span
              className={`status ${beneficiary.expediente?.activo === false ? "inactive" : "active"}`}
            >
              {beneficiary.expediente?.activo === false
                ? "Expediente inactivo"
                : "Expediente activo"}
            </span>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Nombre completo</dt>
              <dd>{beneficiary.nombre}</dd>
            </div>
            <div>
              <dt>DPI/CUI</dt>
              <dd>{beneficiary.cuiEnmascarado ?? "No registrado"}</dd>
            </div>
            <div>
              <dt>Fecha de nacimiento</dt>
              <dd>{displayDate(beneficiary.fechaNacimiento)}</dd>
            </div>
            <div>
              <dt>Alfabetismo</dt>
              <dd>{yesNoUnknown(beneficiary.alfabetismo)}</dd>
            </div>
          </dl>
          <div className="card-actions">
            <Link
              className="button secondary"
              to={`/beneficiarias/${beneficiary.id}/psicologia`}
            >
              Abrir Psicología
            </Link>
            <Link
              className="button secondary"
              to={`/beneficiarias/${beneficiary.id}/medicina`}
            >
              Abrir Medicina
            </Link>
          </div>
        </article>

        <article className="panel profile-card">
          <div className="card-heading">
            <div>
              <h2>Ficha inicial</h2>
              <p>Estado del proceso de admisión.</p>
            </div>
            {ficha && (
              <span
                className={`status ${ficha.estado === "BORRADOR" ? "draft" : "active"}`}
              >
                {ficha.estado === "BORRADOR" ? "Borrador" : "Confirmada"}
              </span>
            )}
          </div>
          {ficha ? (
            <>
              <dl className="detail-grid">
                <div>
                  <dt>Correlativo</dt>
                  <dd>{ficha.correlativo ?? "Pendiente"}</dd>
                </div>
                <div>
                  <dt>Fecha de entrevista</dt>
                  <dd>{displayDate(ficha.fecha)}</dd>
                </div>
                <div className="full">
                  <dt>Lugar</dt>
                  <dd>{ficha.lugar ?? "No registrado"}</dd>
                </div>
              </dl>
              <div className="card-actions">
                <Link className="button primary" to={`/fichas/${ficha.id}`}>
                  {ficha.estado === "BORRADOR"
                    ? "Continuar ficha inicial"
                    : "Consultar ficha inicial"}
                </Link>
              </div>
            </>
          ) : (
            <p className="muted-message">
              Este expediente todavía no tiene una ficha inicial disponible.
            </p>
          )}
        </article>
      </div>

      <article className="panel profile-card children-card">
        <div className="card-heading">
          <div>
            <h2>Hijas e hijos vinculados</h2>
            <p>Registros asociados al expediente de la beneficiaria.</p>
          </div>
          {childrenQuery.data && (
            <span className="count-badge">
              {childrenQuery.data.data.length}
            </span>
          )}
        </div>
        <div className="card-actions children-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setShowChildForm((current) => !current);
              createChild.reset();
            }}
          >
            {showChildForm ? "Cancelar registro" : "Registrar hija o hijo"}
          </button>
        </div>
        {showChildForm && (
          <form
            className="child-create-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (childForm.nombre.trim().length >= 2) createChild.mutate();
            }}
          >
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="new-child-name">Nombre completo</label>
                <input
                  id="new-child-name"
                  value={childForm.nombre}
                  onChange={(event) =>
                    setChildForm((current) => ({
                      ...current,
                      nombre: event.target.value,
                    }))
                  }
                  required
                  minLength={2}
                  maxLength={60}
                />
              </div>
              <div className="field">
                <label htmlFor="new-child-cui">DPI/CUI</label>
                <input
                  id="new-child-cui"
                  inputMode="numeric"
                  maxLength={13}
                  value={childForm.cui}
                  onChange={(event) =>
                    setChildForm((current) => ({
                      ...current,
                      cui: event.target.value.replace(/\D/g, ""),
                    }))
                  }
                />
                <small>Opcional. Si se registra, debe tener 13 dígitos.</small>
              </div>
              <div className="field">
                <label htmlFor="new-child-birth">Fecha de nacimiento</label>
                <input
                  id="new-child-birth"
                  type="date"
                  value={childForm.fechaNacimiento}
                  onChange={(event) =>
                    setChildForm((current) => ({
                      ...current,
                      fechaNacimiento: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="new-child-gender">Género</label>
                <select
                  id="new-child-gender"
                  value={childForm.genero}
                  onChange={(event) =>
                    setChildForm((current) => ({
                      ...current,
                      genero: event.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="new-child-recognized">Reconocimiento</label>
                <select
                  id="new-child-recognized"
                  value={childForm.reconocido}
                  onChange={(event) =>
                    setChildForm((current) => ({
                      ...current,
                      reconocido: event.target.value,
                    }))
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="true">Reconocida/o</option>
                  <option value="false">No reconocida/o</option>
                </select>
              </div>
            </div>
            {childForm.cui && childForm.cui.length !== 13 && (
              <p className="field-error">
                El DPI/CUI debe contener 13 dígitos.
              </p>
            )}
            {createChildError && (
              <div className="alert error" role="alert">
                <strong>{createChildError.mensaje}</strong>
                {createChildError.errores.map((item) => (
                  <span key={`${item.campo}-${item.mensaje}`}>
                    {item.mensaje}
                  </span>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button
                className="button primary"
                type="submit"
                disabled={
                  createChild.isPending ||
                  childForm.nombre.trim().length < 2 ||
                  (!!childForm.cui && childForm.cui.length !== 13)
                }
              >
                {createChild.isPending ? "Registrando…" : "Guardar hija o hijo"}
              </button>
            </div>
          </form>
        )}
        {childrenQuery.isLoading && (
          <p className="status-message" role="status">
            Cargando registros vinculados…
          </p>
        )}
        {childrenError && (
          <div className="alert error" role="alert">
            <strong>{childrenError.mensaje}</strong>
          </div>
        )}
        {childrenQuery.data?.data.length === 0 && (
          <p className="muted-message">
            No hay hijas o hijos registrados en este expediente.
          </p>
        )}
        {!!childrenQuery.data?.data.length && (
          <>
            <div className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Fecha de nacimiento</th>
                    <th>Género</th>
                    <th>Reconocimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {childrenQuery.data.data.map((child) => (
                    <tr key={child.id}>
                      <td>{child.nombre}</td>
                      <td>{displayDate(child.fechaNacimiento)}</td>
                      <td>{child.genero ?? "No registrado"}</td>
                      <td>{yesNoUnknown(child.reconocido)}</td>
                      <td>
                        <span
                          className={`status ${child.activo ? "active" : "inactive"}`}
                        >
                          {child.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-actions">
              <Link
                className="button secondary"
                to={`/beneficiarias/${beneficiary.id}/psicologia-infantil`}
              >
                Abrir Psicología infantil
              </Link>
              <Link
                className="button secondary"
                to={`/beneficiarias/${beneficiary.id}/medicina-infantil`}
              >
                Abrir Medicina infantil
              </Link>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
