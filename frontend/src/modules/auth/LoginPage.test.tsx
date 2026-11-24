import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  session: null as null | { mustChangePassword: boolean },
  sessionExpired: false,
  signIn: vi.fn(),
  clearSessionNotice: vi.fn(),
}));

vi.mock("./AuthContext", () => ({ useAuth: () => auth }));

import { LoginPage } from "./LoginPage";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/beneficiarias" element={<h1>Beneficiarias</h1>} />
        <Route
          path="/cambiar-contrasena"
          element={<h1>Cambiar contraseña</h1>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    auth.session = null;
    auth.sessionExpired = false;
    auth.signIn.mockReset();
    auth.clearSessionNotice.mockReset();
  });

  it("envía las credenciales y abre el sistema", async () => {
    auth.signIn.mockResolvedValue({ mustChangePassword: false });
    renderLogin();

    fireEvent.change(screen.getByLabelText("Usuario *"), {
      target: { value: " usuario.prueba " },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "contrasena-sintetica" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    await waitFor(() =>
      expect(auth.signIn).toHaveBeenCalledWith(
        "usuario.prueba",
        "contrasena-sintetica",
      ),
    );
    expect(
      await screen.findByRole("heading", { name: "Beneficiarias" }),
    ).toBeInTheDocument();
  });

  it("envía al cambio obligatorio cuando la cuenta lo requiere", async () => {
    auth.signIn.mockResolvedValue({ mustChangePassword: true });
    renderLogin();
    fireEvent.change(screen.getByLabelText("Usuario *"), {
      target: { value: "usuario.prueba" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña *"), {
      target: { value: "temporal-sintetica" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(
      await screen.findByRole("heading", { name: "Cambiar contraseña" }),
    ).toBeInTheDocument();
  });

  it("no envía un formulario incompleto", () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Ingresa tu usuario y contraseña.",
    );
    expect(auth.signIn).not.toHaveBeenCalled();
  });
});
