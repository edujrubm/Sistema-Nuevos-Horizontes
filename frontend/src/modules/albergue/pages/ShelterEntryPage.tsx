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
  const [searchText, setSearchText] = useState("");
  const [matches, setMatches] = useState<BeneficiarySummary[]>([]);
  const [selected, setSelected] = useState<BeneficiarySummary>();
  const [searchRequestError, setSearchRequestError] = useState<string>();

  const childrenQuery = useQuery({
    queryKey: ["beneficiary", selected?.id, "children"],
    queryFn: ({ signal }) => listBeneficiaryChildren(selected!.id, signal),
    enabled: !!selected,
  });
  const activeChildren = childrenQuery.data?.data.filter((child) => child.activo) ?? [];
  const searchMutation = useMutation({
    mutationFn: () =>
      searchBeneficiaryMatches(
        /^\d+$/.test(searchText.trim())
          ? { cui: searchText.trim() }
          : { nombre: searchText.trim() },
      ),
    onSuccess: (response) => {
      setMatches(response.data);
      setSelected(undefined);
      setSearchRequestError(undefined);
    },
    onError: (error) => {
      setMatches([]);
      setSelected(undefined);
      setSearchRequestError(
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

  const searchError =
    /^\d+$/.test(searchText.trim()) &&
    searchText.trim() &&
    !/^\d{13}$/.test(searchText.trim())
      ? "El DPI/CUI debe tener 13 dígitos; para buscar por nombre escribe al menos 2 letras."
      : searchText.trim() &&
          !/^\d+$/.test(searchText.trim()) &&
          searchText.trim().length < 2
        ? "Escribe al menos 2 caracteres del nombre."
        : undefined;

  function search() {
    if (searchError || !searchText.trim()) return;
    entryMutation.reset();
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
              label="Nombre o DPI/CUI"
              value={searchText}
              error={searchError}
              hint="Escribe al menos 2 letras del nombre o los 13 dígitos del DPI/CUI."
              onChange={(event) => {
                setSearchText(event.target.value);
                setSelected(undefined);
                setMatches([]);
                setNinoIds([]);
                entryMutation.reset();
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
                Boolean(searchError) ||
                !searchText.trim() ||
                searchMutation.isPending ||
                entryMutation.isPending
              }
              onClick={search}
            >
              {searchMutation.isPending ? "Buscando…" : "Buscar beneficiaria"}
            </button>
          </div>

          {searchRequestError ? (
            <div className="alert error" role="alert">
              <strong>{searchRequestError}</strong>
            </div>
          ) : null}
          {matches.length === 0 && searchMutation.isSuccess ? (
            <div className="alert warning" role="status">
              <strong>No se encontró una beneficiaria con esos datos.</strong>
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
                      entryMutation.reset();
                    }}
                  />
                  <span>
                    <strong>{beneficiary.nombre}</strong>
                    <small>
                      {beneficiary.cuiEnmascarado ?? "DPI/CUI sin registrar"}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          {selected ? (
            <section className="shelter-entry-confirmation">
              {childrenQuery.isLoading && <p>Cargando hijas e hijos…</p>}
              {childrenQuery.error && (
                <div className="alert error" role="alert">
                  No fue posible consultar las hijas e hijos. Reintenta antes de confirmar.
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void childrenQuery.refetch()}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {activeChildren.length > 0 ? (
                <fieldset className="shelter-children-selector" disabled={entryMutation.isPending}>
                  <legend>¿Ingresará con hijas o hijos?</legend>
                  <p>Selecciona todos o únicamente quienes la acompañarán.</p>
                  <div className="form-actions">
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => setNinoIds(activeChildren.map((child) => child.id))}
                    >
                      Seleccionar todos
                    </button>
                    <button
                      className="button text"
                      type="button"
                      onClick={() => setNinoIds([])}
                    >
                      Ninguno
                    </button>
                  </div>
                  <div className="shelter-children-list">
                    {activeChildren.map((child) => (
                      <label key={child.id}>
                        <input
                          type="checkbox"
                          checked={ninoIds.includes(child.id)}
                          onChange={(event) =>
                            setNinoIds(
                              event.target.checked
                                ? [...ninoIds, child.id]
                                : ninoIds.filter((id) => id !== child.id),
                            )
                          }
                        />
                        {child.nombre}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
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
                {entryMutation.isPending ? "Registrando…" : "Registrar ingreso"}
              </button>
            </section>
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
