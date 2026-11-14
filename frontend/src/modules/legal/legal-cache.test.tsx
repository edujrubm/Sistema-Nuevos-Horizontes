import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  useParams,
} from "react-router-dom";
import { legalApi } from "./api/legal-api";
import { useLegalEditor } from "./hooks/useLegalEditor";
import type { Ficha } from "@/shared/types/api";

const record = (beneficiary: string): Ficha => ({
  id: "12",
  tipo: "LEGAL",
  estado: "BORRADOR",
  version: 1,
  profesionalId: "1",
  fechaAtencion: "2026-11-14T16:00:00Z",
  creadoEn: "2026-11-14T16:00:00Z",
  detalle: { demandadoNombreDeclarado: "Caso " + beneficiary },
});

const clients: QueryClient[] = [];
function mount(loadDocuments = async () => ({ fichas: ["12"] })) {
  function DocumentsProbe() {
    const query = useQuery({
      queryKey: ["documentos", "100", "contexto"],
      queryFn: loadDocuments,
      staleTime: 60_000,
    });
    return (
      <p>
        {query.data?.fichas.length
          ? "Ficha disponible para adjuntar PDF"
          : "Sin fichas para PDF"}
      </p>
    );
  }
  function Probe() {
    const { beneficiaryId = "" } = useParams();
    const editor = useLegalEditor(beneficiaryId, "12", false);
    if (editor.cargando) return <p>Cargando caso</p>;
    return (
      <>
        <input
          aria-label="Texto de prueba"
          value={String(editor.detail.demandadoNombreDeclarado ?? "")}
          onChange={(event) =>
            editor.change("demandadoNombreDeclarado", event.target.value)
          }
        />
        <button
          onClick={() => {
            void editor.submit();
          }}
        >
          Guardar prueba
        </button>
        <button onClick={editor.reload}>Recargar prueba</button>
        <button
          onClick={() => {
            void editor.submit(true);
          }}
        >
          Confirmar prueba
        </button>
        <output>{editor.record?.estado ?? ""}</output>
      </>
    );
  }
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const router = createMemoryRouter(
    [
      { path: "/documentos", element: <DocumentsProbe /> },
      { path: "/:beneficiaryId", element: <Probe /> },
    ],
    { initialEntries: ["/100"] },
  );
  client.setQueryDefaults(["documentos"], { gcTime: 60_000 });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { client, router };
}

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});

it("al cambiar de beneficiaria no reutiliza el contenido de otro caso", async () => {
  const get = vi
    .spyOn(legalApi, "get")
    .mockImplementation(async (_id, _reference, _signal, beneficiary) =>
      record(beneficiary),
    );
  const { router } = mount();
  await screen.findByDisplayValue("Caso 100");
  await act(async () => {
    await router.navigate("/200");
  });
  await screen.findByDisplayValue("Caso 200");
  expect(screen.queryByDisplayValue("Caso 100")).not.toBeInTheDocument();
  expect(get.mock.calls.map((args) => args[3])).toEqual(["100", "200"]);
});

it("invalidar otra consulta y enfocar la ventana no borra un borrador", async () => {
  const get = vi
    .spyOn(legalApi, "get")
    .mockImplementation(async (_id, _reference, _signal, beneficiary) =>
      record(beneficiary),
    );
  const { client } = mount();
  const input = await screen.findByDisplayValue("Caso 100");
  fireEvent.change(input, { target: { value: "Texto aún sin guardar" } });
  await act(async () => {
    await client.invalidateQueries({
      queryKey: ["legal", "beneficiaria", "100"],
      refetchType: "none",
    });
    window.dispatchEvent(new Event("focus"));
  });
  expect(input).toHaveValue("Texto aún sin guardar");
  expect(get).toHaveBeenCalledTimes(1);
});

it("dos clics mientras el guardado está pendiente producen una sola mutación", async () => {
  vi.spyOn(legalApi, "get").mockResolvedValue(record("100"));
  let complete!: (value: Ficha) => void;
  const save = vi.spyOn(legalApi, "save").mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  mount();
  fireEvent.change(await screen.findByDisplayValue("Caso 100"), {
    target: { value: "Texto actualizado" },
  });
  const button = screen.getByRole("button", { name: "Guardar prueba" });
  fireEvent.click(button);
  fireEvent.click(button);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  await act(async () => {
    complete({
      ...record("100"),
      version: 2,
      detalle: { demandadoNombreDeclarado: "Texto actualizado" },
    });
  });
  await screen.findByDisplayValue("Texto actualizado");
  expect(save).toHaveBeenCalledTimes(1);
});

it("al confirmar refresca el contexto documental antes de adjuntar el PDF", async () => {
  vi.spyOn(legalApi, "get").mockResolvedValue(record("100"));
  vi.spyOn(legalApi, "confirm").mockResolvedValue({
    ...record("100"),
    estado: "CONFIRMADO",
    version: 2,
  });
  const loadDocuments = vi.fn(async () => ({ fichas: ["12"] }));
  const { client, router } = mount(loadDocuments);
  client.setQueryData(["documentos", "100", "contexto"], { fichas: [] });
  await screen.findByDisplayValue("Caso 100");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Confirmar prueba" }));
  });
  await screen.findByText("CONFIRMADO");
  await act(async () => {
    await router.navigate("/documentos");
  });
  await screen.findByText("Ficha disponible para adjuntar PDF");
  expect(loadDocuments).toHaveBeenCalledTimes(1);
});
