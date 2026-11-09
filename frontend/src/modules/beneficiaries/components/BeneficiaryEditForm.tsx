import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

import { updateBeneficiary, type BeneficiaryDetail, type UpdateBeneficiaryInput } from "../api/beneficiaries-api";
import { ApiError } from "@/shared/api/api-error";

interface BeneficiaryEditFormProps {
  beneficiary: BeneficiaryDetail;
  onCancel: () => void;
  onSaved: () => void;
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function BeneficiaryEditForm({ beneficiary, onCancel, onSaved }: BeneficiaryEditFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(beneficiary.nombre);
  const [birthDate, setBirthDate] = useState(beneficiary.fechaNacimiento ?? "");
  const [literacy, setLiteracy] = useState(beneficiary.alfabetismo == null ? "" : String(beneficiary.alfabetismo));
  const [permanentDisease, setPermanentDisease] = useState(beneficiary.enfermedadPermanente == null ? "" : String(beneficiary.enfermedadPermanente));
  const [diseaseName, setDiseaseName] = useState(beneficiary.nombreEnfermedad ?? "");
  const [treatment, setTreatment] = useState(beneficiary.tipoTratamiento ?? "");
  const [otherConditions, setOtherConditions] = useState(beneficiary.otrosPadecimientos ?? "");
  const [address, setAddress] = useState(beneficiary.residencia?.direccionActual ?? "");
  const [houseNumber, setHouseNumber] = useState(beneficiary.residencia?.numeroCasa ?? "");
  const [mobile, setMobile] = useState(beneficiary.residencia?.telefonoCelular ?? "");
  const [alternateAddress, setAlternateAddress] = useState(beneficiary.residencia?.direccionAlternativa ?? "");
  const [contact, setContact] = useState(beneficiary.residencia?.personaEnlace ?? "");
  const [contactRelation, setContactRelation] = useState(beneficiary.residencia?.relacionPersonaEnlace ?? "");
  const [areaType, setAreaType] = useState(beneficiary.residencia?.urbano == null ? "" : beneficiary.residencia.urbano ? "URBANA" : "RURAL");
  const [workplace, setWorkplace] = useState(beneficiary.lugarOcupacion?.nombre ?? "");
  const [workAddress, setWorkAddress] = useState(beneficiary.lugarOcupacion?.direccion ?? "");
  const [workPhone, setWorkPhone] = useState(beneficiary.lugarOcupacion?.telefono ?? "");
  const [workContact, setWorkContact] = useState(beneficiary.lugarOcupacion?.personaContacto ?? "");
  const [workRole, setWorkRole] = useState(beneficiary.lugarOcupacion?.cargoPersonaContacto ?? "");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string>();

  const mutation = useMutation({
    mutationFn: (input: UpdateBeneficiaryInput) => updateBeneficiary(beneficiary.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["beneficiary", beneficiary.id] });
      onSaved();
    },
  });
  const apiError = mutation.error instanceof ApiError ? mutation.error.body : undefined;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setLocalError("El nombre debe tener al menos 2 caracteres.");
    if (reason.trim().length < 3) return setLocalError("Explica el motivo de la actualización.");
    setLocalError(undefined);
    const residencia = {
      direccionActual: optional(address), numeroCasa: optional(houseNumber), telefonoCelular: optional(mobile),
      direccionAlternativa: optional(alternateAddress), personaEnlace: optional(contact),
      relacionPersonaEnlace: optional(contactRelation), urbano: areaType ? areaType === "URBANA" : undefined,
      paisResidenciaId: beneficiary.residencia?.paisResidenciaId ?? undefined,
      departamentoResidenciaId: beneficiary.residencia?.departamentoResidenciaId ?? undefined,
      municipioResidenciaId: beneficiary.residencia?.municipioResidenciaId ?? undefined,
      areaResidencial: beneficiary.residencia?.areaResidencial ? {
        colonia: beneficiary.residencia.areaResidencial.colonia ?? undefined,
        barrioPopular: beneficiary.residencia.areaResidencial.barrioPopular ?? undefined,
        asentamiento: beneficiary.residencia.areaResidencial.asentamiento ?? undefined,
        zona: beneficiary.residencia.areaResidencial.zona ?? undefined,
        aldea: beneficiary.residencia.areaResidencial.aldea ?? undefined,
        caserio: beneficiary.residencia.areaResidencial.caserio ?? undefined,
        canton: beneficiary.residencia.areaResidencial.canton ?? undefined,
        otro: beneficiary.residencia.areaResidencial.otro ?? undefined,
      } : undefined,
    };
    const lugarOcupacion = {
      nombre: optional(workplace), direccion: optional(workAddress), telefono: optional(workPhone),
      personaContacto: optional(workContact), cargoPersonaContacto: optional(workRole),
    };
    mutation.mutate({
      nombre: name.trim(),
      ...(birthDate && { fechaNacimiento: birthDate }),
      ...(literacy && { alfabetismo: literacy === "true" }),
      ...(permanentDisease && { enfermedadPermanente: permanentDisease === "true" }),
      ...(optional(diseaseName) && { nombreEnfermedad: diseaseName.trim() }),
      ...(optional(treatment) && { tipoTratamiento: treatment.trim() }),
      ...(optional(otherConditions) && { otrosPadecimientos: otherConditions.trim() }),
      ...(Object.values(residencia).some((value) => value !== undefined) && { residencia }),
      ...(Object.values(lugarOcupacion).some((value) => value !== undefined) && { lugarOcupacion }),
      version: beneficiary.version,
      motivo: reason.trim(),
    });
  }

  return (
    <form className="panel form-panel profile-editor" onSubmit={submit} noValidate>
      <div className="section-heading"><h2>Actualizar perfil</h2><p>Los cambios quedan versionados y requieren un motivo.</p></div>
      {(localError || apiError) && <div className="alert error" role="alert"><strong>{localError ?? apiError?.mensaje}</strong>{apiError?.errores.map((item) => <span key={`${item.campo}-${item.mensaje}`}>{item.mensaje}</span>)}</div>}
      <div className="form-grid">
        <div className="field full"><label htmlFor="edit-name">Nombre completo</label><input id="edit-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-birth">Fecha de nacimiento</label><input id="edit-birth" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-literacy">¿Sabe leer y escribir?</label><select id="edit-literacy" value={literacy} onChange={(event) => setLiteracy(event.target.value)}><option value="">No registrado</option><option value="true">Sí</option><option value="false">No</option></select></div>
        <div className="field"><label htmlFor="edit-disease">¿Tiene enfermedad permanente?</label><select id="edit-disease" value={permanentDisease} onChange={(event) => setPermanentDisease(event.target.value)}><option value="">No registrado</option><option value="true">Sí</option><option value="false">No</option></select></div>
        {permanentDisease === "true" && <><div className="field"><label htmlFor="edit-disease-name">Enfermedad</label><input id="edit-disease-name" value={diseaseName} onChange={(event) => setDiseaseName(event.target.value)} /></div><div className="field"><label htmlFor="edit-treatment">Tratamiento</label><input id="edit-treatment" value={treatment} onChange={(event) => setTreatment(event.target.value)} /></div></>}
        <div className="field full"><label htmlFor="edit-other-conditions">Otros padecimientos</label><textarea id="edit-other-conditions" value={otherConditions} onChange={(event) => setOtherConditions(event.target.value)} /></div>
      </div>
      <div className="section-heading subsection-heading"><h3>Residencia y contacto</h3></div>
      <div className="form-grid">
        <div className="field full"><label htmlFor="edit-address">Dirección actual</label><input id="edit-address" value={address} onChange={(event) => setAddress(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-house">Número de casa</label><input id="edit-house" value={houseNumber} onChange={(event) => setHouseNumber(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-mobile">Celular</label><input id="edit-mobile" value={mobile} onChange={(event) => setMobile(event.target.value)} /></div>
        <div className="field full"><label htmlFor="edit-alt-address">Dirección alternativa</label><input id="edit-alt-address" value={alternateAddress} onChange={(event) => setAlternateAddress(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-contact">Persona enlace</label><input id="edit-contact" value={contact} onChange={(event) => setContact(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-relation">Relación</label><input id="edit-relation" value={contactRelation} onChange={(event) => setContactRelation(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-area">Área residencial</label><select id="edit-area" value={areaType} onChange={(event) => setAreaType(event.target.value)}><option value="">No registrada</option><option value="URBANA">Urbana</option><option value="RURAL">Rural</option></select></div>
      </div>
      <div className="section-heading subsection-heading"><h3>Lugar de trabajo o estudio</h3></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="edit-workplace">Nombre</label><input id="edit-workplace" value={workplace} onChange={(event) => setWorkplace(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-work-phone">Teléfono</label><input id="edit-work-phone" value={workPhone} onChange={(event) => setWorkPhone(event.target.value)} /></div>
        <div className="field full"><label htmlFor="edit-work-address">Dirección</label><input id="edit-work-address" value={workAddress} onChange={(event) => setWorkAddress(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-work-contact">Persona de contacto</label><input id="edit-work-contact" value={workContact} onChange={(event) => setWorkContact(event.target.value)} /></div>
        <div className="field"><label htmlFor="edit-work-role">Cargo</label><input id="edit-work-role" value={workRole} onChange={(event) => setWorkRole(event.target.value)} /></div>
        <div className="field full"><label htmlFor="edit-reason">Motivo de la actualización</label><textarea id="edit-reason" value={reason} onChange={(event) => setReason(event.target.value)} /></div>
      </div>
      <div className="form-actions"><button className="button secondary" type="button" onClick={onCancel}>Cancelar</button><button className="button primary" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Actualizando…" : "Actualizar perfil"}</button></div>
    </form>
  );
}
