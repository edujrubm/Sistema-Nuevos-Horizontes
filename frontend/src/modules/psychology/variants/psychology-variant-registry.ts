import { PsychologyWomanVariant } from "../components/PsychologyWomanVariant";
import { createFormVariantRegistry } from "@/modules/area-forms/variants";

export const psychologyVariantRegistry = createFormVariantRegistry([
  { code: "PSICOLOGIA_MUJER", component: PsychologyWomanVariant },
]);
