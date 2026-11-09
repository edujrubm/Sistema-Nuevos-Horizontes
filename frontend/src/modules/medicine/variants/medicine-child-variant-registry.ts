import { createElement } from "react";

import { createFormVariantRegistry } from "@/modules/area-forms/variants";
import {
  MedicineChildVariantWithMother,
} from "../components/MedicineBeneficiaryVariant";

export function createMedicineChildVariantRegistry(motherName?: string) {
  return createFormVariantRegistry([
    {
      code: "MEDICINA_NINEZ",
      component: (props) =>
        createElement(MedicineChildVariantWithMother, {
          ...props,
          motherName,
        }),
    },
  ]);
}
