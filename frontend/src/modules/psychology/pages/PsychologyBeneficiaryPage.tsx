import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  confirmAreaForm,
  createAreaForm,
  getAreaForm,
  listAreaForms,
  listAreaFormTypes,
  updateAreaForm,
  type AreaForm,
  type CreateAreaFormInput,
} from "@/modules/area-forms/api/area-forms-api";
import {
  AreaFormList,
  AreaFormShell,
  NewAreaFormPanel,
  type AreaFormEditorState,
} from "@/modules/area-forms/components";
import {
  FormVariantRenderer,
  type FormVariantFieldError,
  type FormVariantValue,
} from "@/modules/area-forms/variants";
import { psychologyVariantRegistry } from "../variants/psychology-variant-registry";
import { getBeneficiary } from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { FormErrorSummary } from "@/shared/components/forms";

const psychologyWomanType = "PSICOLOGIA_MUJER";

function apiMessage(error: unknown) {
  return error instanceof ApiError ? error.body.mensaje : undefined;
}

function apiFieldErrors(error: unknown): FormVariantFieldError[] {
  if (!(error instanceof ApiError)) return [];
  return error.body.errores.map((item) => ({
    field: item.campo,
    message: item.mensaje,
  }));
}

interface PsychologyFormEditorProps {
  formId: string;
  draftStateCode: string;
  onClose: () => void;
}

function PsychologyFormEditor({
  formId,
  draftStateCode,
  onClose,
}: PsychologyFormEditorProps) {
  const queryClient = useQueryClient();
  const formQuery = useQuery({
    queryKey: ["area-form", formId],
    queryFn: ({ signal }) => getAreaForm(formId, signal),
  });
  const [value, setValue] = useState<FormVariantValue>({
    detail: {},
    mentalExam: null,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    FormVariantFieldError[]
  >([]);

  useEffect(() => {
    if (!formQuery.data?.data) return;
    setValue({
      detail: formQuery.data.data.detalle,
      mentalExam: formQuery.data.data.examenMental,
    });
    setDirty(false);
  }, [formQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (reason: string) => {
      const form = formQuery.data?.data;
      if (!form) throw new Error("Formulario no disponible.");
      return updateAreaForm(form.id, {
        version: form.version,
        motivo: reason,
        detalle: value.detail,
        ...(value.mentalExam ? { examenMental: value.mentalExam } : {}),
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["area-form", formId], response);
      void queryClient.invalidateQueries({ queryKey: ["psychology-forms"] });
      setDirty(false);
      setSaved(true);
      setValidationErrors([]);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (reason: string) => {
      const form = formQuery.data?.data;
      if (!form) throw new Error("Formulario no disponible.");
      return confirmAreaForm(form.id, form.version, reason);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["area-form", formId], response);
      void queryClient.invalidateQueries({ queryKey: ["psychology-forms"] });
      setDirty(false);
      setSaved(false);
      setValidationErrors([]);
    },
  });

  const operationError = updateMutation.error ?? confirmMutation.error;
  const conflict =
    operationError instanceof ApiError &&
    ["VERSION_CONFLICT", "VERSION_DESACTUALIZADA"].includes(
      operationError.body.codigo,
    );
  const state: AreaFormEditorState = formQuery.isLoading
    ? "loading"
    : conflict
      ? "conflict"
      : operationError || formQuery.error
        ? "error"
        : updateMutation.isPending || confirmMutation.isPending
          ? "saving"
          : dirty
            ? "dirty"
            : saved
              ? "saved"
              : "idle";
  const fieldErrors = [...apiFieldErrors(operationError), ...validationErrors];
  const form = formQuery.data?.data;

  function changeValue(nextValue: FormVariantValue) {
    setValue(nextValue);
    setDirty(true);
    setSaved(false);
    setValidationErrors([]);
    updateMutation.reset();
    confirmMutation.reset();
  }

  function confirm(reason: string) {
    const required: FormVariantFieldError[] = [];
    if (!String(value.detail.motivoConsulta ?? "").trim()) {
      required.push({
        field: "detalle.motivoConsulta",
        message: "El motivo de consulta es obligatorio para confirmar.",
      });
    }
    if (!String(value.detail.planTerapeutico ?? "").trim()) {
      required.push({
        field: "detalle.planTerapeutico",
        message: "El plan terapéutico es obligatorio para confirmar.",
      });
    }
    if (required.length) {
      setValidationErrors(required);
      return;
    }
    confirmMutation.mutate(reason);
  }

  const summaryErrors = fieldErrors.map((error) => ({
    fieldId: error.field
      .replace("detalle.", "detail.")
      .replace("examenMental.", "mentalExam."),
    label: error.field,
    message: error.message,
  }));

  return (
    <>
      <FormErrorSummary errors={summaryErrors} />
      <AreaFormShell
        form={form}
        state={state}
        error={apiMessage(operationError ?? formQuery.error)}
        draftStateCode={draftStateCode}
        onSave={(reason) => updateMutation.mutate(reason)}
        onConfirm={confirm}
        onReload={() => {
          updateMutation.reset();
          confirmMutation.reset();
          setValidationErrors([]);
          void formQuery.refetch();
        }}
        onCancel={onClose}
      >
        {form ? (
          <FormVariantRenderer
            type={form.tipo}
            registry={psychologyVariantRegistry}
            value={value}
            errors={fieldErrors}
            readOnly={form.estado !== draftStateCode}
            onChange={changeValue}
            onUnsupported={onClose}
          />
        ) : null}
      </AreaFormShell>
    </>
  );
}

export function PsychologyBeneficiaryPage() {
  const { beneficiaryId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const beneficiaryQuery = useQuery({
    queryKey: ["beneficiary", beneficiaryId],
    queryFn: ({ signal }) => getBeneficiary(beneficiaryId, signal),
    enabled: Boolean(beneficiaryId),
  });
  const formsQuery = useQuery({
    queryKey: ["psychology-forms", beneficiaryId],
    queryFn: ({ signal }) =>
      listAreaForms(
        beneficiaryId,
        { tipo: psychologyWomanType, limit: 25 },
        signal,
      ),
    enabled: Boolean(beneficiaryId),
  });
  const typesQuery = useQuery({
    queryKey: ["area-form-types"],
    queryFn: ({ signal }) => listAreaFormTypes(signal),
  });
  const createMutation = useMutation({
    mutationFn: (input: CreateAreaFormInput) =>
      createAreaForm(beneficiaryId, input),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ["psychology-forms"] });
      setCreating(false);
      setSelectedFormId(response.data.id);
    },
  });

  const psychologyTypes = useMemo(
    () =>
      (typesQuery.data?.data ?? []).filter(
        (type) => type.codigo === psychologyWomanType,
      ),
    [typesQuery.data],
  );
  const draftStateCode =
    typesQuery.data?.estados.codigos.borrador ?? "BORRADOR";
  const professionalId = import.meta.env.DEV
    ? import.meta.env.VITE_DEV_PROFESSIONAL_ID
    : undefined;

  if (selectedFormId) {
    return (
      <PsychologyFormEditor
        formId={selectedFormId}
        draftStateCode={draftStateCode}
        onClose={() => setSelectedFormId(undefined)}
      />
    );
  }

  return (
    <section>
      <PageHeader
        title="Psicología"
        description={
          beneficiaryQuery.data
            ? `Evaluación psicológica de ${beneficiaryQuery.data.nombre}.`
            : "Evaluación psicológica y plan terapéutico."
        }
        action={
          <Link
            className="button secondary"
            to={`/beneficiarias/${beneficiaryId}`}
          >
            Volver al expediente
          </Link>
        }
      />

      {beneficiaryQuery.error ? (
        <div className="alert error" role="alert">
          <strong>
            {apiMessage(beneficiaryQuery.error) ??
              "No fue posible cargar la beneficiaria."}
          </strong>
        </div>
      ) : null}

      {creating ? (
        <NewAreaFormPanel
          types={psychologyTypes}
          professionalId={professionalId}
          catalogReady={typesQuery.data?.estados.listo ?? false}
          busy={createMutation.isPending}
          error={apiMessage(createMutation.error)}
          onCreate={(input) => createMutation.mutate(input)}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <AreaFormList
          forms={formsQuery.data?.data ?? []}
          loading={formsQuery.isLoading || typesQuery.isLoading}
          error={apiMessage(formsQuery.error ?? typesQuery.error)}
          draftStateCode={draftStateCode}
          hasMore={formsQuery.data?.page.hasMore ?? false}
          onOpen={(form: AreaForm) => setSelectedFormId(form.id)}
          onCreate={() => setCreating(true)}
          onRetry={() => {
            void formsQuery.refetch();
            void typesQuery.refetch();
          }}
        />
      )}
    </section>
  );
}
