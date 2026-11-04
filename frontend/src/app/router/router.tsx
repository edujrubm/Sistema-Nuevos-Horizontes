import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { NotFoundPage } from "@/shared/components/NotFoundPage";

const BeneficiariesPage = lazy(() => import("@/modules/beneficiaries/pages/BeneficiariesPage").then((module) => ({ default: module.BeneficiariesPage })));
const BeneficiaryProfilePage = lazy(() => import("@/modules/beneficiaries/pages/BeneficiaryProfilePage").then((module) => ({ default: module.BeneficiaryProfilePage })));
const StartAdmissionPage = lazy(() => import("@/modules/admission/pages/StartAdmissionPage").then((module) => ({ default: module.StartAdmissionPage })));
const AdmissionWizardPage = lazy(() => import("@/modules/admission/pages/AdmissionWizardPage").then((module) => ({ default: module.AdmissionWizardPage })));

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<p className="status-message" role="status">Cargando pantalla…</p>}>{page}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/beneficiarias" replace /> },
      { path: "beneficiarias", element: lazyPage(<BeneficiariesPage />) },
      { path: "beneficiarias/:id", element: lazyPage(<BeneficiaryProfilePage />) },
      { path: "fichas/nueva", element: lazyPage(<StartAdmissionPage />) },
      { path: "fichas/:id", element: lazyPage(<AdmissionWizardPage />) },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
