import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { NotFoundPage } from "@/shared/components/NotFoundPage";

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
      { path: "albergue/movimientos", element: lazyPage(<ShelterMovementsPage />) },
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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
