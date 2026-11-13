import { navegacionMockup } from "../../app/navegacion";
import { Beneficiarias, Expediente } from "../../app/Expediente";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  RouterProvider,
  createMemoryRouter,
} from "react-router-dom";
import { CapacidadesContext } from "../../app/capacidades";
import { soloLectura } from "../../shared/types/api";
import type { Ficha, Capacidades } from "../../shared/types/api";
import { api } from "../../shared/api/area-records";
import { ApiError, http } from "../../shared/api/http";
import { Guarderia, ListadoFichas } from "./Listados";
import { Editor } from "./EditorFicha";
import { EditorEntrada, Historial, Evolucion } from "../evolucion/Evolucion";
const caps: Capacidades = {
  crearFicha: true,
  editarFicha: true,
  confirmarFicha: true,
  crearReferencia: true,
  corregirReferencia: true,
  crearEvolucion: true,
  corregirEvolucion: true,
  verRevisiones: true,
};
const base: Ficha = {
  id: "12",
  tipo: "REFERENCIA_LEGAL",
  estadoCodigo: "BORRADOR",
  version: 3,
  profesionalId: "1",
  fechaAtencion: "2026-11-04T16:00:00Z",
  detalle: { destino: "Institución sintética", motivoReferencia: "Atención" },
};
function envolver(ui: React.ReactNode, capacidades = soloLectura) {
  return render(
    <CapacidadesContext.Provider value={capacidades}>
      <RouterProvider
        router={createMemoryRouter([{ path: "*", element: ui }])}
      />
    </CapacidadesContext.Provider>,
  );
}
describe("módulos de área", () => {
  it("Guardería muestra todos los niños y solo abre inscritos", async () => {
    vi.spyOn(api, "hijos").mockResolvedValue({
      datos: [
        { ninoId: "1", nombre: "Niño sintético", inscrito: true },
        { ninoId: "2", nombre: "Sin inscripción", inscrito: false },
      ],
      pagina: 1,
      limite: 20,
      total: 2,
    });
    render(
      <MemoryRouter initialEntries={["/beneficiarias/100"]}>
        <Routes>
          <Route
            path="/beneficiarias/:beneficiariaId"
            element={<Guarderia />}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Niño sintético")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Ver fichas" })).toHaveLength(1);
    expect(screen.getByText("Consulta no disponible")).toBeVisible();
  });
  it("Listado: vacío, error, reintento y paginación", async () => {
    const call = vi
      .spyOn(api, "fichas")
      .mockRejectedValueOnce(
        new ApiError(
          503,
          "SERVICIO_NO_DISPONIBLE",
          "Servicio temporalmente no disponible",
        ),
      )
      .mockResolvedValue({ datos: [], pagina: 1, limite: 20, total: 0 });
    envolver(<ListadoFichas area="legal" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servicio temporalmente",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Volver a intentar" }),
    );
    expect(await screen.findByText("No hay fichas registradas.")).toBeVisible();
    expect(call).toHaveBeenCalledTimes(2);
  });
  it("Sin capacidades no se muestran acciones de edición o confirmación", () => {
    envolver(
      <Editor
        inicial={base}
        esReferencia
        beneficiariaId="100"
        recargar={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Guardar borrador o cambios" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Confirmar ficha" }),
    ).not.toBeInTheDocument();
  });
  it("Referencia confirmada se consulta sin editar con capacidades de creación", () => {
    envolver(
      <Editor
        inicial={{ ...base, estadoCodigo: "CONFIRMADO" }}
        esReferencia
        beneficiariaId="100"
        recargar={() => {}}
      />,
      { ...soloLectura, crearReferencia: true },
    );
    expect(screen.getByText(/Ficha confirmada/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Guardar borrador o cambios" }),
    ).not.toBeInTheDocument();
  });
  it("Guarda con versión y conserva texto ante conflicto 409", async () => {
    const save = vi
      .spyOn(api, "guardarReferencia")
      .mockRejectedValue(
        new ApiError(409, "VERSION_DESACTUALIZADA", "La versión cambió"),
      );
    envolver(
      <Editor
        inicial={base}
        esReferencia
        beneficiariaId="100"
        recargar={() => {}}
      />,
      caps,
    );
    await userEvent.clear(screen.getByLabelText("Destino"));
    await userEvent.type(screen.getByLabelText("Destino"), "Destino corregido");
    await userEvent.type(
      screen.getByLabelText("Motivo del cambio o confirmación"),
      "Corrección sintética",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador o cambios" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Recarga la versión vigente",
    );
    expect(screen.getByLabelText("Destino")).toHaveValue("Destino corregido");
    expect(save).toHaveBeenCalledWith(
      "12",
      expect.objectContaining({
        version: 3,
        motivo: "Corrección sintética",
        detalle: expect.objectContaining({ destino: "Destino corregido" }),
      }),
    );
  });
  it("Confirmación exige revisión explícita y usa versión vigente", async () => {
    const confirm = vi.spyOn(api, "confirmarReferencia").mockResolvedValue({
      ...base,
      version: 4,
      estadoCodigo: "CONFIRMADO",
    });
    envolver(
      <Editor
        inicial={base}
        esReferencia
        beneficiariaId="100"
        recargar={() => {}}
      />,
      caps,
    );
    expect(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.type(
      screen.getByLabelText("Motivo de confirmación"),
      "Datos revisados",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Confirmar ficha" }),
    );
    await waitFor(() =>
      expect(confirm).toHaveBeenCalledWith("12", {
        version: 3,
        motivo: "Datos revisados",
      }),
    );
    expect(await screen.findByText("Ficha confirmada.")).toBeVisible();
  });
  it("Nueva entrada envía acción, profesional y fecha ISO y conserva datos al fallar", async () => {
    const call = vi
      .spyOn(api, "crearEntrada")
      .mockRejectedValue(
        new ApiError(400, "DATOS_INVALIDOS", "Revisa la ficha"),
      );
    envolver(
      <EditorEntrada
        entrada={null}
        beneficiariaId="100"
        cerrar={() => {}}
        guardar={() => {}}
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Identificador de ficha confirmada"),
      "12",
    );
    await userEvent.type(
      screen.getByLabelText("Identificador del profesional"),
      "1",
    );
    await userEvent.type(screen.getByLabelText("Acción realizada"), "Asesoría");
    await userEvent.type(
      screen.getByLabelText("Seguimiento"),
      "Texto de prueba",
    );
    await userEvent.type(
      screen.getByLabelText("Fecha de atención"),
      "2026-11-04T10:00",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar seguimiento" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revisa la ficha",
    );
    expect(screen.getByLabelText("Seguimiento")).toHaveValue("Texto de prueba");
    expect(call).toHaveBeenCalledWith(
      "100",
      expect.objectContaining({
        formularioId: "12",
        accion: "Asesoría",
        profesionalId: "1",
        fechaAtencion: expect.stringMatching(/Z$/),
      }),
    );
  });
  it("Historial muestra autor, motivo y comparación antes/después", async () => {
    vi.spyOn(api, "revisiones").mockResolvedValue({
      datos: [
        {
          id: "1",
          operacion: "UPDATE",
          fecha: "2026-11-04T16:00:00Z",
          autor: { usuarioId: "1", nombre: "Profesional sintético" },
          motivo: "Error de transcripción",
          cambios: [
            { campo: "contenido", antes: "Anterior", despues: "Corregido" },
          ],
        },
      ],
      pagina: 1,
      limite: 20,
      total: 1,
    });
    envolver(<Historial id="12" cerrar={() => {}} />);
    expect((await screen.findAllByText("Anterior"))[0]).toBeVisible();
    expect(screen.getByText("Corregido")).toBeVisible();
    expect(screen.getByText(/Profesional sintético/)).toBeVisible();
    expect(screen.getByText(/Error de transcripción/)).toBeVisible();
  });
});
describe("Cliente HTTP", () => {
  it("Normaliza contrato español y conserva id de solicitud", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            estado: 400,
            codigo: "DATOS_INVALIDOS",
            mensaje: "Revisa los campos.",
            errores: [{ campo: "accion", mensaje: "Es obligatoria." }],
            idSolicitud: "SOL-prueba",
          }),
          { status: 400 },
        ),
      ),
    );
    await expect(http("/ruta")).rejects.toMatchObject({
      codigo: "DATOS_INVALIDOS",
      idSolicitud: "SOL-prueba",
      errores: [{ campo: "accion", mensaje: "Es obligatoria." }],
    });
    vi.unstubAllGlobals();
  });
  it("Identificadores grandes se conservan como texto", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ id: "9007199254740993" })),
        ),
    );
    expect(await http("/ruta")).toEqual({ id: "9007199254740993" });
    vi.unstubAllGlobals();
  });
});

describe("Recuperación de errores de transporte", () => {
  it("No reintenta escrituras sin confirmación y avisa del riesgo de duplicado", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(new Error("Private network text"));
    vi.stubGlobal("fetch", fetcher);
    await expect(
      http("/ruta", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      codigo: "RESPUESTA_NO_RECIBIDA",
      message: expect.stringContaining("Consulta el registro"),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
  it("Una respuesta de error ajena no muestra mensajes internos ni rompe la interfaz", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            codigo: "UNKNOWN_CODE",
            mensaje: "Private internal English text",
            errores: [null],
          }),
          { status: 502 },
        ),
      ),
    );
    await expect(http("/ruta")).rejects.toMatchObject({
      codigo: "RESPUESTA_NO_VALIDA",
      errores: [],
      message: expect.not.stringContaining("Private"),
    });
    vi.unstubAllGlobals();
  });
});

describe("Protección de borradores", () => {
  it("Atrás conserva el texto si se cancela y navega si se confirma", async () => {
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(false);
    const router = createMemoryRouter(
      [
        { path: "/antes", element: <p>Pantalla anterior</p> },
        {
          path: "/editar",
          element: (
            <Editor
              inicial={base}
              esReferencia
              beneficiariaId="100"
              recargar={() => {}}
            />
          ),
        },
      ],
      { initialEntries: ["/antes", "/editar"], initialIndex: 1 },
    );
    render(
      <CapacidadesContext.Provider value={caps}>
        <RouterProvider router={router} />
      </CapacidadesContext.Provider>,
    );
    await userEvent.type(
      screen.getByLabelText("Destino"),
      " con cambio pendiente",
    );
    await act(async () => {
      await router.navigate(-1);
    });
    expect(confirmar).toHaveBeenCalled();
    expect(screen.getByLabelText("Destino")).toHaveValue(
      "Institución sintética con cambio pendiente",
    );
    confirmar.mockReturnValue(true);
    await act(async () => {
      await router.navigate(-1);
    });
    expect(await screen.findByText("Pantalla anterior")).toBeVisible();
  });
});

describe("Distribución de los mockups", () => {
  it("Legal conserva cuatro páginas y permite consultar todas las secciones", async () => {
    envolver(
      <Editor
        inicial={{
          ...base,
          tipo: "LEGAL",
          estadoCodigo: "CONFIRMADO",
          detalle: {
            demandadoNombreDeclarado: "Parte sintética",
            diagnosticoJuridico: "Diagnóstico de prueba",
            juzgado: "Juzgado sintético",
          },
        }}
        esReferencia={false}
        beneficiariaId="100"
        recargar={() => {}}
      />,
    );
    expect(
      screen
        .getByRole("navigation", { name: "Secciones de la ficha" })
        .querySelectorAll("button"),
    ).toHaveLength(4);
    expect(screen.getByText("Parte sintética")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: /2 Diagnóstico y plan/ }),
    );
    expect(screen.getByText("Diagnóstico de prueba")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: /3 Proceso judicial/ }),
    );
    expect(screen.getByText("Juzgado sintético")).toBeVisible();
  });
  it("Social conserva el borrador al cambiar de página y envía todos los campos guardados", async () => {
    const guardar = vi.spyOn(api, "guardarFicha").mockResolvedValue({
      ...base,
      tipo: "SOCIAL",
      estado: "BORRADOR",
      version: 4,
      detalle: {
        tipoVivienda: "Alquilada",
        historiaViolencia: "Historia sintética",
      },
    });
    envolver(
      <Editor
        inicial={{ ...base, tipo: "SOCIAL", detalle: {} }}
        esReferencia={false}
        beneficiariaId="100"
        recargar={() => {}}
      />,
      caps,
    );
    expect(
      screen
        .getByRole("navigation", { name: "Secciones de la ficha" })
        .querySelectorAll("button"),
    ).toHaveLength(5);
    await userEvent.selectOptions(
      screen.getByLabelText("Tipo de vivienda"),
      "Alquilada",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /2 Historia de violencia/ }),
    );
    await userEvent.type(
      screen.getByLabelText("Historia de vida de la problemática de violencia"),
      "Historia sintética",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /1 Identificación/ }),
    );
    expect(screen.getByLabelText("Tipo de vivienda")).toHaveValue("Alquilada");
    await userEvent.type(
      screen.getByLabelText("Motivo del cambio o confirmación"),
      "Guardar ficha social",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar borrador o cambios" }),
    );
    await waitFor(() =>
      expect(guardar).toHaveBeenCalledWith(
        "12",
        expect.objectContaining({
          detalle: expect.objectContaining({
            tipoVivienda: "Alquilada",
            historiaViolencia: "Historia sintética",
          }),
        }),
      ),
    );
  });
  it("Guardería conserva cinco secciones y no inventa autorizaciones de traslado", async () => {
    envolver(
      <Editor
        inicial={{
          ...base,
          tipo: "GUARDERIA",
          estadoCodigo: "CONFIRMADO",
          detalle: {},
        }}
        esReferencia={false}
        beneficiariaId="100"
        recargar={() => {}}
      />,
    );
    expect(
      screen
        .getByRole("navigation", { name: "Secciones de la ficha" })
        .querySelectorAll("button"),
    ).toHaveLength(5);
    await userEvent.click(screen.getByRole("button", { name: /2 Traslado/ }));
    expect(
      screen.getByText(/información de traslado no está disponible/),
    ).toBeVisible();
  });
  it("Referencia presenta una vista previa con el contenido actual", async () => {
    envolver(
      <Editor
        inicial={base}
        esReferencia
        beneficiariaId="100"
        recargar={() => {}}
      />,
      caps,
    );
    expect(screen.getByRole("heading", { name: "Vista previa" })).toBeVisible();
    await userEvent.clear(screen.getByLabelText("Destino"));
    await userEvent.type(
      screen.getByLabelText("Destino"),
      "Destino actualizado",
    );
    expect(screen.getByText("Destino actualizado")).toBeVisible();
  });
});

it("Riesgos del mockup conservan el texto existente al marcar una opción", async () => {
  const save = vi
    .spyOn(api, "guardarFicha")
    .mockRejectedValue(new ApiError(400, "DATOS_INVALIDOS", "Revisar"));
  envolver(
    <Editor
      inicial={{
        ...base,
        tipo: "SOCIAL",
        detalle: { riesgosIdentificados: "Texto original\nTexto original" },
      }}
      esReferencia={false}
      beneficiariaId="100"
      recargar={() => {}}
    />,
    caps,
  );
  await userEvent.click(
    screen.getByRole("button", { name: /3 Diagnóstico y riesgos/ }),
  );
  await userEvent.click(screen.getByLabelText("Vivienda insegura"));
  await userEvent.type(
    screen.getByLabelText("Motivo del cambio o confirmación"),
    "Registrar selección",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Guardar borrador o cambios" }),
  );
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      "12",
      expect.objectContaining({
        detalle: expect.objectContaining({
          riesgosIdentificados:
            "Texto original\nTexto original\nVivienda insegura",
        }),
      }),
    ),
  );
  expect(screen.getByLabelText("Otros riesgos o detalle")).toHaveValue(
    "Texto original\nTexto original",
  );
});

describe("Navegación institucional según los mockups", () => {
  it("Legal no muestra un menú del reparto de trabajo", () => {
    expect(
      navegacionMockup("Área Legal", "/beneficiarias/100").map((x) => x.label),
    ).toEqual([
      "Beneficiarias",
      "Área Legal",
      "Hoja evolutiva",
      "Documentos",
      "Reportes",
    ]);
  });
  it("El listado usa el menú institucional del mockup", () => {
    expect(
      navegacionMockup("Gestión de beneficiarias", "/beneficiarias/").map(
        (x) => x.label,
      ),
    ).toEqual([
      "Inicio",
      "Beneficiarias",
      "Expedientes",
      "Albergue",
      "Auditoría",
    ]);
  });
  it("Beneficiarias consulta registros reales a través del adaptador y abre el expediente", async () => {
    vi.spyOn(api, "beneficiarias").mockResolvedValue({
      data: [
        { id: "100", nombre: "Beneficiaria sintética", cuiEnmascarado: null },
      ],
      page: { hasMore: false, nextCursor: null },
    });
    envolver(<Beneficiarias />);
    expect(await screen.findByText("Beneficiaria sintética")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ver expediente" }),
    ).toHaveAttribute("href", "/beneficiarias/100");
  });
  it("El expediente no presenta un dashboard del reparto áreas y contempla las áreas institucionales", () => {
    envolver(<Expediente />);
    expect(screen.queryByText("Continuar la atención")).not.toBeInTheDocument();
    for (const area of [
      "Trabajo Social",
      "Psicología",
      "Medicina",
      "Área Legal",
      "Guardería",
      "Albergue",
      "Documentos",
    ])
      expect(screen.getByRole("rowheader", { name: area })).toBeVisible();
  });
});

it("Un enlace directo abre el historial existente dentro de la hoja evolutiva", async () => {
  vi.spyOn(api, "evolucion").mockResolvedValue({
    datos: [],
    pagina: 1,
    limite: 20,
    total: 0,
  });
  vi.spyOn(api, "revisiones").mockResolvedValue({
    datos: [
      {
        id: "1",
        operacion: "UPDATE",
        fecha: "2026-11-04T16:00:00Z",
        autor: { usuarioId: "1" },
        motivo: "Motivo sintético enlazado",
        cambios: [],
      },
    ],
    pagina: 1,
    limite: 20,
    total: 1,
  });
  render(
    <CapacidadesContext.Provider value={caps}>
      <MemoryRouter
        initialEntries={["/beneficiarias/100/evolucion?historial=1"]}
      >
        <Routes>
          <Route
            path="/beneficiarias/:beneficiariaId/evolucion"
            element={<Evolucion />}
          />
        </Routes>
      </MemoryRouter>
    </CapacidadesContext.Provider>,
  );
  expect(await screen.findByText(/Motivo sintético enlazado/)).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Historial de revisiones" }),
  ).toBeVisible();
});
