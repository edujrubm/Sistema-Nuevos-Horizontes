import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createShelterStay } from "../api/albergue-api";
import {
  listBeneficiaryChildren,
  searchBeneficiaryMatches,
  type BeneficiarySummary,
} from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { TextField } from "@/shared/components/forms";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

export function ShelterEntryPage() {
  const queryClient = useQueryClient();
  const [ninoIds, setNinoIds] = useState<string[]>([]);
  const [cui, setCui] = useState("");
  const [matches, setMatches] = useState<BeneficiarySummary[]>([]);
  const [selected, setSelected] = useState<BeneficiarySummary>();
  const [searchError, setSearchError] = useState<string>();

  const childrenQuery = useQuery({
    queryKey: ["beneficiary", selected?.id, "children"],
    queryFn: ({ signal }) => listBeneficiaryChildren(selected!.id, signal),
    enabled: !!selected,
  });
  const searchMutation = useMutation({
    mutationFn: () => searchBeneficiaryMatches(cui.trim()),
    onSuccess: (response) => {
      setMatches(response.data);
      setSelected(undefined);
      setSearchError(undefined);
    },
    onError: (error) => {
      setMatches([]);
      setSelected(undefined);
      setSearchError(
        apiMessage(error) ?? "No fue posible buscar la beneficiaria.",
      );
    },
  });
  const entryMutation = useMutation({
    mutationFn: (beneficiariaId: string) =>
      createShelterStay({ beneficiariaId, ninoIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shelter"] });
    },
  });

  const cuiError =
    cui.trim() && !/^\d{13}$/.test(cui.trim())
      ? "Ingresa un DPI/CUI de 13 dígitos."
      : undefined;

  function search() {
    if (cuiError || !cui.trim()) return;
    searchMutation.mutate();
  }

  return (
    <section>
      <PageHeader
        title="Registrar ingreso"
        description="Verifica a la beneficiaria antes de abrir una estancia de Albergue."
        action={
          <Link className="button secondary" to="/albergue">
            Volver a Albergue
          </Link>
        }
      />

      {entryMutation.isSuccess ? (
        <div className="alert success" role="status">
          <strong>Ingreso registrado correctamente.</strong>
          <span>La estancia ya aparece en el panel de Albergue.</span>
          <Link className="button secondary" to="/albergue">
            Ver panel de Albergue
          </Link>
        </div>
      ) : (
        <div className="panel form-panel">
          <div className="section-heading">
            <h2>Buscar beneficiaria</h2>
            <p>
              La búsqueda no se guarda en la dirección del navegador. El sistema
              bloqueará una segunda estancia activa.
            </p>
          </div>
          <div className="form-grid">
            <TextField
              label="DPI/CUI"
              inputMode="numeric"
              maxLength={13}
              value={cui}
              error={cuiError}
              hint="Ingresa los 13 dígitos, sin espacios ni guiones."
              onChange={(event) => {
                setCui(event.target.value.replace(/\D/g, ""));
                setSelected(undefined);
                setMatches([]);
                setNinoIds([]);
              }}
              disabled={entryMutation.isPending}
              required
            />
          </div>
          <div className="form-actions">
            <button
              className="button secondary"
              type="button"
              disabled={
                Boolean(cuiError) ||
                !cui.trim() ||
                searchMutation.isPending ||
                entryMutation.isPending
              }
              onClick={search}
            >
              {searchMutation.isPending ? "Buscando…" : "Buscar beneficiaria"}
            </button>
          </div>

          {searchError ? (
            <div className="alert error" role="alert">
              <strong>{searchError}</strong>
            </div>
          ) : null}
          {matches.length === 0 && searchMutation.isSuccess ? (
            <div className="alert warning" role="status">
              <strong>No se encontró una beneficiaria con ese DPI/CUI.</strong>
              <span>
                Verifica el dato o registra la ficha inicial antes de crear la
                estancia.
              </span>
            </div>
          ) : null}
          {matches.length > 0 ? (
            <fieldset className="shelter-match-list">
              <legend>Selecciona una beneficiaria</legend>
              {matches.map((beneficiary) => (
                <label className="shelter-match" key={beneficiary.id}>
                  <input
                    type="radio"
                    disabled={entryMutation.isPending}
                    name="beneficiary"
                    checked={selected?.id === beneficiary.id}
                    onChange={() => {
                      setSelected(beneficiary);
                      setNinoIds([]);
                    }}
                  />
                  <span>
                    <strong>{beneficiary.nombre}</strong>
                    <small>
                      {beneficiary.cuiEnmascarado ?? "DPI/CUI registrado"}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {selected ? (
            <div className="alert warning" role="status">
              <strong>Confirmación requerida</strong>
              <fieldset disabled={entryMutation.isPending}>
                <legend>Hijas e hijos que ingresan como acompañantes</legend>
                {childrenQuery.isLoading && <p>Cargando hijos…</p>}
                {childrenQuery.error && (
                  <p role="alert">
                    No fue posible consultar los hijos. Reintenta la consulta
                    antes de confirmar.
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => void childrenQuery.refetch()}
                    >
                      Reintentar hijos
                    </button>
                  </p>
                )}
                {childrenQuery.data?.data
                  .filter((n) => n.activo)
                  .map((n) => (
                    <label key={n.id}>
                      <input
                        type="checkbox"
                        checked={ninoIds.includes(n.id)}
                        onChange={(e) =>
                          setNinoIds(
                            e.target.checked
                              ? [...ninoIds, n.id]
                              : ninoIds.filter((id) => id !== n.id),
                          )
                        }
                      />
                      {n.nombre}
                    </label>
                  ))}
              </fieldset>
              <span>
                Vas a registrar un ingreso para {selected.nombre}. Se verificará
                nuevamente que no tenga una estancia activa.
              </span>
              <button
                className="button primary"
                type="button"
                disabled={
                  entryMutation.isPending ||
                  childrenQuery.isLoading ||
                  !!childrenQuery.error
                }
                onClick={() => entryMutation.mutate(selected.id)}
              >
                {entryMutation.isPending ? "Registrando…" : "Confirmar ingreso"}
              </button>
            </div>
          ) : null}
          {entryMutation.error ? (
            <div className="alert error" role="alert">
              <strong>No se pudo registrar el ingreso.</strong>
              <span>
                {apiMessage(entryMutation.error) ?? "Inténtalo nuevamente."}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
