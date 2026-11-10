import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  confirmAreaForm,
  createAreaForm,
  discardAreaForm,
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
import { getBeneficiary } from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { FormErrorSummary } from "@/shared/components/forms";
import { medicineBeneficiaryVariantRegistry } from "../variants/medicine-beneficiary-variant-registry";

const beneficiaryMedicineTypes = new Set([
  "MEDICINA_MUJER",
  "MEDICINA_ADOLESCENTE",
]);

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

interface MedicineFormEditorProps {
  formId: string;
  draftStateCode: string;
  beneficiaryName?: string;
  onClose: () => void;
}

function MedicineFormEditor({
  formId,
  draftStateCode,
  beneficiaryName,
  onClose,
}: MedicineFormEditorProps) {
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
    setValue({ detail: formQuery.data.data.detalle, mentalExam: null });
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
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["area-form", formId], response);
      void queryClient.invalidateQueries({
        queryKey: ["medicine-beneficiary-forms"],
      });
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
      void queryClient.invalidateQueries({
        queryKey: ["medicine-beneficiary-forms"],
      });
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
  const canConfirm = Boolean(
    String(value.detail.motivoConsulta ?? "").trim(),
  );

  function changeValue(nextValue: FormVariantValue) {
    setValue(nextValue);
    setDirty(true);
    setSaved(false);
    setValidationErrors([]);
    updateMutation.reset();
    confirmMutation.reset();
  }

  function confirm(reason: string) {
    if (!String(value.detail.motivoConsulta ?? "").trim()) {
      setValidationErrors([
        {
          field: "detalle.motivoConsulta",
          message: "El motivo de consulta es obligatorio para confirmar.",
        },
      ]);
      return;
    }
    confirmMutation.mutate(reason);
  }

  const summaryErrors = fieldErrors.map((error) => ({
    fieldId: error.field.replace("detalle.", "detail."),
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
        subjectLabel={beneficiaryName}
        canConfirm={canConfirm}
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
            registry={medicineBeneficiaryVariantRegistry}
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

export function MedicineBeneficiaryPage() {
  const { beneficiaryId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const beneficiaryQuery = useQuery({
    queryKey: ["beneficiary", beneficiaryId],
    queryFn: ({ signal }) => getBeneficiary(beneficiaryId, signal),
    enabled: Boolean(beneficiaryId),
  });
  const typesQuery = useQuery({
    queryKey: ["area-form-types"],
    queryFn: ({ signal }) => listAreaFormTypes(signal),
  });
  const medicineTypes = useMemo(
    () =>
      (typesQuery.data?.data ?? []).filter((type) =>
        beneficiaryMedicineTypes.has(type.codigo),
      ),
    [typesQuery.data],
  );
  const medicineAreaId = medicineTypes[0]?.areaId;
  const formsQuery = useQuery({
    queryKey: ["medicine-beneficiary-forms", beneficiaryId, medicineAreaId],
    queryFn: ({ signal }) =>
      listAreaForms(
        beneficiaryId,
        { areaId: medicineAreaId, limit: 25 },
        signal,
      ),
    enabled: Boolean(beneficiaryId && medicineAreaId),
  });
  const medicineForms = useMemo(
    () =>
      (formsQuery.data?.data ?? []).filter(
        (form) =>
          form.ninoId === null && beneficiaryMedicineTypes.has(form.tipo),
      ),
    [formsQuery.data],
  );
  const createMutation = useMutation({
    mutationFn: (input: CreateAreaFormInput) =>
      createAreaForm(beneficiaryId, input),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: ["medicine-beneficiary-forms"],
      });
      setCreating(false);
      setSelectedFormId(response.data.id);
    },
  });
  const discardMutation = useMutation({
    mutationFn: ({ form, reason }: { form: AreaForm; reason: string }) =>
      discardAreaForm(form.id, form.version, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["medicine-beneficiary-forms", beneficiaryId],
      });
    },
  });

  const draftStateCode =
    typesQuery.data?.estados.codigos.borrador ?? "BORRADOR";
  const professionalId = import.meta.env.DEV
    ? import.meta.env.VITE_DEV_PROFESSIONAL_ID
    : undefined;

  if (selectedFormId) {
    return (
      <MedicineFormEditor
        formId={selectedFormId}
        draftStateCode={draftStateCode}
        beneficiaryName={beneficiaryQuery.data?.nombre}
        onClose={() => setSelectedFormId(undefined)}
      />
    );
  }

  return (
    <section>
      <PageHeader
        title="Medicina"
        description={
          beneficiaryQuery.data
            ? `Historia clínica y atención médica de ${beneficiaryQuery.data.nombre}.`
            : "Historia clínica, examen y tratamiento."
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
          types={medicineTypes}
          professionalId={professionalId}
          catalogReady={typesQuery.data?.estados.listo ?? false}
          busy={createMutation.isPending}
          error={apiMessage(createMutation.error)}
          onCreate={(input) => createMutation.mutate(input)}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <AreaFormList
          forms={medicineForms}
          loading={typesQuery.isLoading || formsQuery.isLoading}
          error={apiMessage(typesQuery.error ?? formsQuery.error)}
          draftStateCode={draftStateCode}
          discardingId={
            discardMutation.isPending
              ? discardMutation.variables?.form.id
              : undefined
          }
          discardError={apiMessage(discardMutation.error)}
          hasMore={formsQuery.data?.page.hasMore ?? false}
          createDisabled={!typesQuery.isLoading && medicineTypes.length === 0}
          createDisabledReason="El catálogo no publicó variantes médicas para beneficiarias."
          onOpen={(form) => setSelectedFormId(form.id)}
          onPrepareDiscard={() => discardMutation.reset()}
          onDiscard={async (form, reason) => {
            await discardMutation.mutateAsync({ form, reason });
          }}
          onCreate={() => setCreating(true)}
          onRetry={() => {
            void typesQuery.refetch();
            void formsQuery.refetch();
          }}
        />
      )}
    </section>
  );
}
