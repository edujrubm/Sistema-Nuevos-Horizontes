import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  closeShelterStay,
  listAllActiveStays,
  registerShelterBirth,
} from "../api/albergue-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { SelectField, TextField } from "@/shared/components/forms";

type Panel = "egreso" | "nacimiento";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

function isoToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
  }).format(new Date());
}

export function ShelterClosurePage() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [birthConfirmation, setBirthConfirmation] = useState(false);
  const [panel, setPanel] = useState<Panel>("egreso");
  const [stayId, setStayId] = useState("");
  const [egressConfirmation, setEgressConfirmation] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cui, setCui] = useState("");
  const [gender, setGender] = useState("");
  const [recognized, setRecognized] = useState(false);
  const staysQuery = useQuery({
    queryKey: ["shelter", "stays"],
    queryFn: ({ signal }) => listAllActiveStays(signal),
  });
  const activeStays = useMemo(
    () => (staysQuery.data?.datos ?? []).filter((stay) => !stay.fechaEgreso),
    [staysQuery.data],
  );
  const egressMutation = useMutation({
    mutationFn: () => closeShelterStay(stayId, reason.trim()),
    onSuccess: async () => {
      setEgressConfirmation(false);
      setReason("");
      setStayId("");
      await queryClient.invalidateQueries({ queryKey: ["shelter"] });
    },
  });
  const birthMutation = useMutation({
    mutationFn: () =>
      registerShelterBirth(stayId, {
        nombre: name.trim(),
        fechaNacimiento: birthDate,
        cui: cui || undefined,
        genero: (gender as "M" | "F") || undefined,
        reconocido: recognized,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shelter"] });
      setBirthConfirmation(false);
      setName("");
      setBirthDate("");
      setCui("");
      setGender("");
      setRecognized(false);
    },
  });
  const birthDateError =
    birthDate && birthDate > isoToday()
      ? "La fecha de nacimiento no puede ser futura."
      : undefined;
  const cuiError =
    cui && !/^\d{13}$/.test(cui)
      ? "El DPI/CUI debe tener 13 dígitos."
      : undefined;
  const canRegisterBirth = Boolean(
    stayId && name.trim() && birthDate && !birthDateError && !cuiError,
  );

  return (
    <section>
      <PageHeader
        title="Egreso y nacimiento"
        description="Gestiona acciones excepcionales de una estancia activa de Albergue."
        action={
          <Link className="button secondary" to="/albergue">
            Volver a Albergue
          </Link>
        }
      />
      {staysQuery.error ? (
        <div className="alert error" role="alert">
          <strong>No fue posible cargar las estancias.</strong>
          <span>{apiMessage(staysQuery.error) ?? "Inténtalo nuevamente."}</span>
        </div>
      ) : null}
      <div
        className="shelter-tabs"
        role="tablist"
        aria-label="Acciones de estancia"
      >
        <button
          className={panel === "egreso" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={panel === "egreso"}
          onClick={() => {
            setPanel("egreso");
            setBirthConfirmation(false);
            setEgressConfirmation(false);
          }}
        >
          Registrar egreso
        </button>
        <button
          className={panel === "nacimiento" ? "active" : ""}
          type="button"
          role="tab"
          aria-selected={panel === "nacimiento"}
          onClick={() => {
            setPanel("nacimiento");
            setBirthConfirmation(false);
            setEgressConfirmation(false);
          }}
        >
          Registrar nacimiento
        </button>
      </div>
      <section className="panel form-panel">
        <fieldset
          className="shelter-operation"
          disabled={egressMutation.isPending || birthMutation.isPending}
        >
          {panel === "egreso" ? (
            <>
              <div className="section-heading">
                <h2>Egreso definitivo</h2>
                <p>
                  Esta acción finaliza la estancia actual. No se puede deshacer
                  desde esta pantalla.
                </p>
              </div>
              <div className="form-grid">
                <SelectField
                  label="Estancia activa"
                  value={stayId}
                  onChange={(event) => {
                    setStayId(event.target.value);
                    setEgressConfirmation(false);
                  }}
                  required
                >
                  <option value="">Selecciona una estancia</option>
                  {activeStays.map((stay) => (
                    <option key={stay.id} value={stay.id}>
                      Estancia #{stay.id} ·{" "}
                      {stay.beneficiariaNombre ||
                        `Expediente #${stay.beneficiariaId}`}
                    </option>
                  ))}
                </SelectField>
              </div>
              {stayId ? (
                <div className="alert warning">
                  <strong>
                    Confirma el egreso definitivo de{" "}
                    {activeStays.find((s) => s.id === stayId)
                      ?.beneficiariaNombre ||
                      `Expediente #${activeStays.find((s) => s.id === stayId)?.beneficiariaId}`}
                  </strong>
                  <TextField
                    label="Motivo del egreso"
                    value={reason}
                    maxLength={2000}
                    required
                    onChange={(e) => {
                      setReason(e.target.value);
                      setEgressConfirmation(false);
                    }}
                  />
                  <span>
                    La estancia seleccionada quedará finalizada y no admitirá
                    nuevos movimientos ni nacimientos.
                  </span>
                  <label className="shelter-confirmation">
                    <input
                      type="checkbox"
                      checked={egressConfirmation}
                      onChange={(event) =>
                        setEgressConfirmation(event.target.checked)
                      }
                    />{" "}
                    Confirmo que deseo finalizar esta estancia.
                  </label>
                  <button
                    className="button danger"
                    type="button"
                    disabled={
                      !reason.trim() ||
                      !egressConfirmation ||
                      egressMutation.isPending
                    }
                    onClick={() => egressMutation.mutate()}
                  >
                    {egressMutation.isPending
                      ? "Finalizando…"
                      : "Confirmar egreso definitivo"}
                  </button>
                </div>
              ) : null}
              {egressMutation.isSuccess ? (
                <div className="alert success" role="status">
                  <strong>Egreso registrado correctamente.</strong>
                </div>
              ) : null}
              {egressMutation.error ? (
                <div className="alert error" role="alert">
                  <strong>No fue posible registrar el egreso.</strong>
                  <span>
                    {apiMessage(egressMutation.error) ??
                      "Inténtalo nuevamente."}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="section-heading">
                <h2>Registrar nacimiento</h2>
                <p>
                  Esta acción crea el vínculo excepcional del recién nacido con
                  el expediente y la estancia activa.
                </p>
              </div>
              <div className="form-grid">
                <SelectField
                  label="Estancia activa"
                  value={stayId}
                  onChange={(event) => {
                    setStayId(event.target.value);
                    setBirthConfirmation(false);
                  }}
                  required
                >
                  <option value="">Selecciona una estancia</option>
                  {activeStays.map((stay) => (
                    <option key={stay.id} value={stay.id}>
                      Estancia #{stay.id} ·{" "}
                      {stay.beneficiariaNombre ||
                        `Expediente #${stay.beneficiariaId}`}
                    </option>
                  ))}
                </SelectField>
                <TextField
                  label="Nombre"
                  value={name}
                  maxLength={60}
                  onChange={(event) => {
                    setName(event.target.value);
                    setBirthConfirmation(false);
                  }}
                  required
                />
                <TextField
                  label="Fecha de nacimiento"
                  type="date"
                  value={birthDate}
                  max={isoToday()}
                  error={birthDateError}
                  onChange={(event) => {
                    setBirthDate(event.target.value);
                    setBirthConfirmation(false);
                  }}
                  required
                />
                <TextField
                  label="DPI/CUI"
                  value={cui}
                  inputMode="numeric"
                  maxLength={13}
                  error={cuiError}
                  hint="Opcional. Si existe, debe contener 13 dígitos."
                  onChange={(event) => {
                    setCui(event.target.value.replace(/\D/g, ""));
                    setBirthConfirmation(false);
                  }}
                />
                <SelectField
                  label="Género"
                  value={gender}
                  onChange={(event) => {
                    setGender(event.target.value);
                    setBirthConfirmation(false);
                  }}
                >
                  <option value="">No registrado</option>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </SelectField>
                <label className="shelter-checkbox">
                  <input
                    type="checkbox"
                    checked={recognized}
                    onChange={(event) => {
                      setRecognized(event.target.checked);
                      setBirthConfirmation(false);
                    }}
                  />{" "}
                  Reconocido legalmente
                </label>
              </div>
              <p>
                Se vinculará a{" "}
                {activeStays.find((s) => s.id === stayId)?.beneficiariaNombre ||
                  "la beneficiaria seleccionada"}{" "}
                y a su estancia activa.
              </p>
              <label className="shelter-confirmation">
                <input
                  type="checkbox"
                  checked={birthConfirmation}
                  onChange={(e) => setBirthConfirmation(e.target.checked)}
                />{" "}
                Confirmo el registro de este nacimiento y su vínculo con la
                beneficiaria.
              </label>
              <div className="form-actions">
                <button
                  className="button primary"
                  type="button"
                  disabled={
                    !birthConfirmation ||
                    !canRegisterBirth ||
                    birthMutation.isPending
                  }
                  onClick={() => birthMutation.mutate()}
                >
                  {birthMutation.isPending
                    ? "Registrando…"
                    : "Registrar nacimiento"}
                </button>
              </div>
              {birthMutation.isSuccess ? (
                <div className="alert success" role="status">
                  <strong>Nacimiento registrado correctamente.</strong>
                  <span>
                    El vínculo fue enviado al expediente de la beneficiaria.
                  </span>
                </div>
              ) : null}
              {birthMutation.error ? (
                <div className="alert error" role="alert">
                  <strong>No fue posible registrar el nacimiento.</strong>
                  <span>
                    {apiMessage(birthMutation.error) ?? "Inténtalo nuevamente."}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </fieldset>
      </section>
    </section>
  );
}
