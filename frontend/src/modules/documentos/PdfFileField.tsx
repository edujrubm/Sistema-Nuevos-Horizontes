import { validarPdf } from "./api";
/** Selector reutilizable: no carga, no convierte y no interpreta el nombre como HTML. */
export function PdfFileField({
  id,
  onChange,
}: {
  id: string;
  onChange: (file: File | undefined, error: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>Archivo PDF</label>
      <input
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        aria-required="true"
        aria-describedby={`${id}-ayuda`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          onChange(file, file ? validarPdf(file) || "" : "");
        }}
      />
      <small id={`${id}-ayuda`}>Solo PDF, máximo 20 MB.</small>
    </div>
  );
}
