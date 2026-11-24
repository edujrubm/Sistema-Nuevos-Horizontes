import { createFormVariantRegistry } from "@/modules/area-forms/variants";
import { PsychologyChildVariant } from "../components/PsychologyChildVariant";

export const psychologyChildVariantRegistry = createFormVariantRegistry([
  { code: "PSICOLOGIA_NINEZ", component: PsychologyChildVariant },
]);
