import { createFormVariantRegistry } from "@/modules/area-forms/variants";
import {
  MedicineAdolescentVariant,
  MedicineWomanVariant,
} from "../components/MedicineBeneficiaryVariant";

export const medicineBeneficiaryVariantRegistry = createFormVariantRegistry([
  { code: "MEDICINA_MUJER", component: MedicineWomanVariant },
  { code: "MEDICINA_ADOLESCENTE", component: MedicineAdolescentVariant },
]);
