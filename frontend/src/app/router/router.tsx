import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { BeneficiariesPage } from "@/modules/beneficiaries/pages/BeneficiariesPage";
import { StartAdmissionPage } from "@/modules/admission/pages/StartAdmissionPage";
import { NotFoundPage } from "@/shared/components/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/beneficiarias" replace /> },
      { path: "beneficiarias", element: <BeneficiariesPage /> },
      { path: "fichas/nueva", element: <StartAdmissionPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
