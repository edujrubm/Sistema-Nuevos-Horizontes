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
import {
  getBeneficiary,
  listBeneficiaryChildren,
} from "@/modules/beneficiaries/api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";
import { PageHeader } from "@/shared/components/PageHeader";
import { FormErrorSummary } from "@/shared/components/forms";
import { createMedicineChildVariantRegistry } from "../variants/medicine-child-variant-registry";

const medicineChildType = "MEDICINA_NINEZ";

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

interface MedicineChildEditorProps {
  formId: string;
  draftStateCode: string;
  subjectNames: Readonly<Record<string, string>>;
  motherName?: string;
  onClose: () => void;
}

function MedicineChildEditor({
  formId,
  draftStateCode,
  subjectNames,
  motherName,
  onClose,
}: MedicineChildEditorProps) {
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
  const variantRegistry = useMemo(
    () => createMedicineChildVariantRegistry(motherName),
    [motherName],
  );

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
        queryKey: ["medicine-child-forms"],
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
        queryKey: ["medicine-child-forms"],
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
  const subjectLabel = form?.ninoId
    ? (subjectNames[form.ninoId] ?? "Registro infantil")
    : undefined;

  return (
    <>
      <FormErrorSummary errors={summaryErrors} />
      <AreaFormShell
        form={form}
        state={state}
        error={apiMessage(operationError ?? formQuery.error)}
        draftStateCode={draftStateCode}
        subjectLabel={subjectLabel}
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
            registry={variantRegistry}
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

export function MedicineChildPage() {
  const { beneficiaryId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const beneficiaryQuery = useQuery({
    queryKey: ["beneficiary", beneficiaryId],
    queryFn: ({ signal }) => getBeneficiary(beneficiaryId, signal),
    enabled: Boolean(beneficiaryId),
  });
  const childrenQuery = useQuery({
    queryKey: ["beneficiary", beneficiaryId, "children"],
    queryFn: ({ signal }) => listBeneficiaryChildren(beneficiaryId, signal),
    enabled: Boolean(beneficiaryId),
  });
  const formsQuery = useQuery({
    queryKey: ["medicine-child-forms", beneficiaryId],
    queryFn: ({ signal }) =>
      listAreaForms(
        beneficiaryId,
        { tipo: medicineChildType, limit: 25 },
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
      void queryClient.invalidateQueries({
        queryKey: ["medicine-child-forms", beneficiaryId],
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
        queryKey: ["medicine-child-forms", beneficiaryId],
      });
    },
  });

  const medicineTypes = useMemo(
    () =>
      (typesQuery.data?.data ?? []).filter(
        (type) => type.codigo === medicineChildType,
      ),
    [typesQuery.data],
  );
  const children = childrenQuery.data?.data ?? [];
  const activeChildren = children.filter((child) => child.activo);
  const subjectNames = useMemo(
    () => Object.fromEntries(children.map((child) => [child.id, child.nombre])),
    [children],
  );
  const draftStateCode =
    typesQuery.data?.estados.codigos.borrador ?? "BORRADOR";
  const professionalId = import.meta.env.DEV
    ? import.meta.env.VITE_DEV_PROFESSIONAL_ID
    : undefined;

  if (selectedFormId) {
    return (
      <MedicineChildEditor
        formId={selectedFormId}
        draftStateCode={draftStateCode}
        subjectNames={subjectNames}
        motherName={beneficiaryQuery.data?.nombre}
        onClose={() => setSelectedFormId(undefined)}
      />
    );
  }

  return (
    <section>
      <PageHeader
        title="Medicina infantil"
        description={
          beneficiaryQuery.data
            ? `Fichas médicas de niñas y niños vinculados al expediente de ${beneficiaryQuery.data.nombre}.`
            : "Atención médica infantil vinculada al expediente."
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

      {childrenQuery.error ? (
        <div className="alert error" role="alert">
          <strong>
            {apiMessage(childrenQuery.error) ??
              "No fue posible cargar las hijas e hijos vinculados."}
          </strong>
        </div>
      ) : null}

      {!childrenQuery.isLoading && activeChildren.length === 0 ? (
        <div className="alert warning" role="status">
          <strong>No hay niñas o niños activos para seleccionar.</strong>
          <span>
            Los registros infantiles deben vincularse previamente desde la ficha
            inicial.
          </span>
        </div>
      ) : null}

      {creating ? (
        <NewAreaFormPanel
          types={medicineTypes}
          childrenOptions={activeChildren.map((child) => ({
            id: child.id,
            name: child.nombre,
          }))}
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
          loading={
            formsQuery.isLoading ||
            typesQuery.isLoading ||
            childrenQuery.isLoading
          }
          error={apiMessage(
            formsQuery.error ?? typesQuery.error ?? childrenQuery.error,
          )}
          draftStateCode={draftStateCode}
          subjectNameById={subjectNames}
          discardingId={
            discardMutation.isPending
              ? discardMutation.variables?.form.id
              : undefined
          }
          discardError={apiMessage(discardMutation.error)}
          createDisabled={activeChildren.length === 0}
          createDisabledReason="Vincula una niña o niño activo desde la ficha inicial antes de crear la ficha."
          hasMore={formsQuery.data?.page.hasMore ?? false}
          onOpen={(form) => setSelectedFormId(form.id)}
          onPrepareDiscard={() => discardMutation.reset()}
          onDiscard={async (form, reason) => {
            await discardMutation.mutateAsync({ form, reason });
          }}
          onCreate={() => setCreating(true)}
          onRetry={() => {
            void formsQuery.refetch();
            void typesQuery.refetch();
            void childrenQuery.refetch();
          }}
        />
      )}
    </section>
  );
}
