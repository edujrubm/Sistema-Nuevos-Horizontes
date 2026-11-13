import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { NotFoundPage } from "@/shared/components/NotFoundPage";

const AreaRecordsLayout = lazy(() =>
  import("../AreaRecordsLayout").then((m) => ({
    default: m.AreaRecordsLayout,
  })),
);
const LegalListPage = lazy(() =>
  import("../../modules/legal").then((m) => ({ default: m.LegalListPage })),
);
const LegalEditorPage = lazy(() =>
  import("../../modules/legal").then((m) => ({ default: m.LegalEditorPage })),
);
const DocumentsPage = lazy(() =>
  import("../../modules/documentos/DocumentsPage").then((m) => ({
    default: m.DocumentsPage,
  })),
);
const ListadoFichas = lazy(() =>
  import("../../modules/formularios/Listados").then((m) => ({
    default: m.ListadoFichas,
  })),
);
const Guarderia = lazy(() =>
  import("../../modules/formularios/Listados").then((m) => ({
    default: m.Guarderia,
  })),
);
const EditorFicha = lazy(() =>
  import("../../modules/formularios/EditorFicha").then((m) => ({
    default: m.EditorFicha,
  })),
);
const Evolucion = lazy(() =>
  import("../../modules/evolucion/Evolucion").then((m) => ({
    default: m.Evolucion,
  })),
);

const BeneficiariesPage = lazy(() =>
  import("@/modules/beneficiaries/pages/BeneficiariesPage").then((module) => ({
    default: module.BeneficiariesPage,
  })),
);
const BeneficiaryProfilePage = lazy(() =>
  import("@/modules/beneficiaries/pages/BeneficiaryProfilePage").then(
    (module) => ({ default: module.BeneficiaryProfilePage }),
  ),
);
const StartAdmissionPage = lazy(() =>
  import("@/modules/admission/pages/StartAdmissionPage").then((module) => ({
    default: module.StartAdmissionPage,
  })),
);
const AdmissionWizardPage = lazy(() =>
  import("@/modules/admission/pages/AdmissionWizardPage").then((module) => ({
    default: module.AdmissionWizardPage,
  })),
);
const AdmissionListPage = lazy(() =>
  import("@/modules/admission/pages/AdmissionListPage").then((module) => ({
    default: module.AdmissionListPage,
  })),
);
const PsychologyBeneficiaryPage = lazy(() =>
  import("@/modules/psychology/pages/PsychologyBeneficiaryPage").then(
    (module) => ({ default: module.PsychologyBeneficiaryPage }),
  ),
);
const PsychologyChildPage = lazy(() =>
  import("@/modules/psychology/pages/PsychologyChildPage").then((module) => ({
    default: module.PsychologyChildPage,
  })),
);
const MedicineBeneficiaryPage = lazy(() =>
  import("@/modules/medicine/pages/MedicineBeneficiaryPage").then((module) => ({
    default: module.MedicineBeneficiaryPage,
  })),
);
const MedicineChildPage = lazy(() =>
  import("@/modules/medicine/pages/MedicineChildPage").then((module) => ({
    default: module.MedicineChildPage,
  })),
);
const ShelterDashboardPage = lazy(() =>
  import("@/modules/albergue/pages/ShelterDashboardPage").then((module) => ({
    default: module.ShelterDashboardPage,
  })),
);
const ShelterEntryPage = lazy(() =>
  import("@/modules/albergue/pages/ShelterEntryPage").then((module) => ({
    default: module.ShelterEntryPage,
  })),
);
const ShelterMovementsPage = lazy(() =>
  import("@/modules/albergue/pages/ShelterMovementsPage").then((module) => ({
    default: module.ShelterMovementsPage,
  })),
);
const ShelterClosurePage = lazy(() =>
  import("@/modules/albergue/pages/ShelterClosurePage").then((module) => ({
    default: module.ShelterClosurePage,
  })),
);
const ShelterHistoryPage = lazy(() =>
  import("@/modules/albergue/pages/ShelterHistoryPage").then((module) => ({
    default: module.ShelterHistoryPage,
  })),
);

function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <p className="status-message" role="status">
          Cargando pantalla…
        </p>
      }
    >
      {page}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/beneficiarias" replace /> },
      { path: "beneficiarias", element: lazyPage(<BeneficiariesPage />) },
      {
        path: "beneficiarias/:beneficiaryId/documentos",
        element: lazyPage(<DocumentsPage />),
      },
      {
        path: "beneficiarias/:id",
        element: lazyPage(<BeneficiaryProfilePage />),
      },
      {
        path: "beneficiarias/:beneficiaryId/psicologia",
        element: lazyPage(<PsychologyBeneficiaryPage />),
      },
      {
        path: "beneficiarias/:beneficiaryId/psicologia-infantil",
        element: lazyPage(<PsychologyChildPage />),
      },
      {
        path: "beneficiarias/:beneficiaryId/medicina",
        element: lazyPage(<MedicineBeneficiaryPage />),
      },
      {
        path: "beneficiarias/:beneficiaryId/medicina-infantil",
        element: lazyPage(<MedicineChildPage />),
      },
      { path: "albergue", element: lazyPage(<ShelterDashboardPage />) },
      { path: "albergue/ingreso", element: lazyPage(<ShelterEntryPage />) },
      {
        path: "albergue/movimientos",
        element: lazyPage(<ShelterMovementsPage />),
      },
      { path: "albergue/cierres", element: lazyPage(<ShelterClosurePage />) },
      { path: "albergue/historial", element: lazyPage(<ShelterHistoryPage />) },
      { path: "fichas/nueva", element: lazyPage(<StartAdmissionPage />) },
      {
        path: "fichas/borradores",
        element: lazyPage(<AdmissionListPage status="BORRADOR" />),
      },
      {
        path: "fichas/confirmadas",
        element: lazyPage(<AdmissionListPage status="CONFIRMADA" />),
      },
      { path: "fichas/:id", element: lazyPage(<AdmissionWizardPage />) },
      {
        path: "beneficiarias/:beneficiariaId",
        element: lazyPage(<AreaRecordsLayout />),
        children: [
          { path: "social", element: <ListadoFichas area="trabajo-social" /> },
          { path: "social/nueva", element: <EditorFicha nueva /> },
          { path: "legal", element: lazyPage(<LegalListPage />) },
          { path: "legal/nueva", element: lazyPage(<LegalEditorPage />) },
          { path: "legal/:fichaId", element: lazyPage(<LegalEditorPage />) },
          { path: "fichas/:fichaId", element: <EditorFicha /> },
          {
            path: "referencias",
            element: lazyPage(<LegalListPage reference />),
          },
          {
            path: "referencias/nueva",
            element: lazyPage(<LegalEditorPage reference />),
          },
          {
            path: "referencias/:fichaId",
            element: lazyPage(<LegalEditorPage reference />),
          },
          { path: "guarderia", element: <Guarderia /> },
          {
            path: "guarderia/:hijoId",
            element: <ListadoFichas area="guarderia" />,
          },
          { path: "evolucion", element: <Evolucion /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
