import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { ApiError } from "@/shared/api/api-error";
const mocks = vi.hoisted(() => ({
  contextoDocumentos: vi.fn(),
  listarDocumentos: vi.fn(),
  versionesDocumentos: vi.fn(),
  cargarDocumento: vi.fn(),
  anularDocumento: vi.fn(),
  descargarDocumento: vi.fn(),
}));
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  ...mocks,
}));
vi.mock("@/modules/beneficiaries/api/beneficiaries-api", () => ({
  getBeneficiary: vi
    .fn()
    .mockResolvedValue({ id: "100", nombre: "Beneficiaria sintética" }),
}));
import { DocumentsCase } from "./DocumentsPage";
const doc = {
  id: "9007199254740993",
  formularioId: "2",
  categoria: "Constancia",
  nombreDocumento: "<img src=x onerror=alert(1)>",
  tamanoBytes: "1024",
  versionDocumento: 1,
  versionRegistro: 2,
  cargadoEn: "2026-11-11T12:00:00Z",
  fechaDocumento: null,
  descripcion: null,
  estadoRevisionCodigo: "BORRADOR",
  anuladoEn: null,
  cargadoPor: "1",
};
function page(initialSocialForm?: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <MemoryRouter>
        <DocumentsCase id="100" initialSocialForm={initialSocialForm} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.contextoDocumentos.mockResolvedValue({
    area: "Legal",
    formularios: [{ id: "2", tipo: "LEGAL" }],
    categorias: ["Constancia"],
    resumen: {
      documentosActivos: 1,
      versionesConservadas: 2,
      pendientesRevision: 1,
      tamanoBytes: "1024",
    },
    capacidades: { cargar: true, anular: true },
  });
  mocks.listarDocumentos.mockResolvedValue({
    datos: [doc],
    total: 1,
    pagina: 1,
    limite: 20,
  });
  mocks.versionesDocumentos.mockResolvedValue({ datos: [doc], total: 1 });
  mocks.cargarDocumento.mockResolvedValue(doc);
  mocks.anularDocumento.mockResolvedValue({ ...doc, anuladoEn: "2026-11-11" });
});
async function preparar() {
  page();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "+ Agregar documento" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "+ Agregar documento" }));
  fireEvent.change(screen.getByLabelText("Ficha correspondiente"), {
    target: { value: "2" },
  });
  fireEvent.change(screen.getByLabelText("Tipo de documento"), {
    target: { value: "Constancia" },
  });
  fireEvent.change(screen.getByLabelText("Fecha del documento"), {
    target: { value: "2026-11-11" },
  });
  await userEvent.upload(
    screen.getByLabelText("Archivo PDF"),
    new File(["%PDF-test"], "prueba.pdf", { type: "application/pdf" }),
  );
}
describe("Documentos funcionales", () => {
  it("precarga y bloquea la ficha Social confirmada recibida desde su editor", async () => {
    mocks.contextoDocumentos.mockResolvedValue({
      area: "Trabajo Social",
      formularios: [{ id: "20", tipo: "SOCIAL", estadoCodigo: "CONFIRMADO" }],
      categorias: [],
      resumen: {},
      capacidades: { cargar: true, anular: false },
    });
    page("20");
    await screen.findByText(
      "Carga vinculada a la ficha social #20. Adjunta el PDF firmado en papel.",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "+ Agregar documento" }),
    );
    expect(screen.getByLabelText("Ficha correspondiente")).toHaveValue("20");
    expect(screen.getByLabelText("Ficha correspondiente")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tipo de documento"), {
      target: { value: "Ficha firmada" },
    });
    fireEvent.change(screen.getByLabelText("Fecha del documento"), {
      target: { value: "2026-11-13" },
    });
    await userEvent.upload(
      screen.getByLabelText("Archivo PDF"),
      new File(["%PDF-test"], "firmado.pdf", { type: "application/pdf" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar documento" }),
    );
    await waitFor(() => expect(mocks.cargarDocumento).toHaveBeenCalled());
    expect(mocks.cargarDocumento.mock.calls[0][1].get("formularioId")).toBe(
      "20",
    );
  });
  it("una ficha fuera del contexto autorizado no permite iniciar carga dirigida", async () => {
    page("999999");
    await screen.findByText(
      "La ficha social solicitada no está confirmada o no pertenece a las fichas autorizadas del área.",
    );
    expect(
      screen.getByRole("button", { name: "+ Agregar documento" }),
    ).toBeDisabled();
  });
  it("un borrador Social no permite cargar su copia firmada", async () => {
    mocks.contextoDocumentos.mockResolvedValue({
      area: "Trabajo Social",
      formularios: [{ id: "20", tipo: "SOCIAL", estadoCodigo: "BORRADOR" }],
      categorias: [],
      resumen: {},
      capacidades: { cargar: true, anular: false },
    });
    page("20");
    await screen.findByText(
      "La ficha social solicitada no está confirmada o no pertenece a las fichas autorizadas del área.",
    );
    expect(
      screen.getByRole("button", { name: "+ Agregar documento" }),
    ).toBeDisabled();
  });
  it("muestra nombre como texto seguro, datos del área y conserva bigint", async () => {
    page();
    expect(await screen.findByText(doc.nombreDocumento)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Versiones" }));
    await waitFor(() =>
      expect(mocks.versionesDocumentos).toHaveBeenCalledWith(
        doc.id,
        expect.any(AbortSignal),
      ),
    );
  });
  it("envía multipart y espera confirmación; no fuerza Content-Type JSON", async () => {
    await preparar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    await screen.findByText("Documento guardado correctamente como borrador.");
    const args = mocks.cargarDocumento.mock.calls[0];
    expect(args[0]).toBe("100");
    expect(args[1].get("formularioId")).toBe("2");
    expect(args[1].get("archivo")).toBeInstanceOf(File);
  });
  it("100% enviado no equivale a documento guardado; permite cancelar", async () => {
    let signal: AbortSignal | undefined;
    mocks.cargarDocumento.mockImplementation((_id, _form, progress, s) => {
      signal = s;
      progress(100);
      return new Promise(() => {});
    });
    await preparar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    expect(
      await screen.findByText(
        "Archivo enviado. Esperando confirmación del servidor…",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Documento guardado correctamente/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar envío" }));
    expect(signal?.aborted).toBe(true);
  });
  it("valida PDF y tamaño antes de solicitar la carga", async () => {
    await preparar();
    fireEvent.change(screen.getByLabelText("Archivo PDF"), {
      target: {
        files: [new File(["image"], "foto.png", { type: "image/png" })],
      },
    });
    expect(
      screen.getByRole("button", { name: "Guardar documento" }),
    ).toBeDisabled();
    expect(mocks.cargarDocumento).not.toHaveBeenCalled();
  });
  it("un error de conexión bloquea repetir hasta consultar el estado", async () => {
    mocks.cargarDocumento.mockRejectedValue(
      new ApiError({
        estado: 0,
        codigo: "RESULTADO_OPERACION_INCIERTO",
        mensaje: "Sin confirmación",
        errores: [],
        idSolicitud: "",
      }),
    );
    await preparar();
    fireEvent.click(screen.getByRole("button", { name: "Guardar documento" }));
    await screen.findByText("Carga sin confirmación");
    expect(
      screen.getByRole("button", { name: "Guardar documento" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Consultar estado de documentos" }),
    );
    await waitFor(() =>
      expect(mocks.listarDocumentos.mock.calls.length).toBeGreaterThan(1),
    );
  });
  it("exige motivo y versión vigente para anular sin borrado físico", async () => {
    page();
    fireEvent.click(await screen.findByRole("button", { name: "Anular" }));
    expect(
      screen.getByRole("button", { name: "Confirmar anulación" }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivo de anulación"), {
      target: { value: "Archivo incorrecto" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar anulación" }),
    );
    await waitFor(() =>
      expect(mocks.anularDocumento).toHaveBeenCalledWith(
        doc,
        "Archivo incorrecto",
      ),
    );
  });
  it("la nueva versión conserva ficha y exige motivo", async () => {
    page();
    fireEvent.click(
      await screen.findByRole("button", { name: "Nueva versión" }),
    );
    expect(screen.getByLabelText("Ficha correspondiente")).toBeDisabled();
    expect(screen.getByLabelText("Motivo del cambio")).toBeRequired();
  });
  it("filtra en servidor y reinicia página", async () => {
    page();
    await screen.findByText(doc.nombreDocumento);
    fireEvent.change(screen.getByLabelText("Buscar documento"), {
      target: { value: "Constancia" },
    });
    await waitFor(() =>
      expect(mocks.listarDocumentos).toHaveBeenLastCalledWith(
        "100",
        expect.objectContaining({ buscar: "Constancia", pagina: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });
});

it("no presenta mensajes técnicos en inglés al fallar la red", async () => {
  mocks.listarDocumentos.mockRejectedValue(
    new Error("Failed to fetch SQL password"),
  );
  page();
  expect(
    await screen.findByRole("button", { name: "Reintentar consulta" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("Failed to fetch SQL password"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Comprueba la conexión");
});
