import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
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
        <Link className="button secondary" to={`/beneficiarias/${id}/social`}>Trabajo Social</Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/legal`}>Legal</Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/referencias`}>Referencias</Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/guarderia`}>Guardería</Link>
        <Link className="button secondary" to={`/beneficiarias/${id}/evolucion`}>Evolución</Link>
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
