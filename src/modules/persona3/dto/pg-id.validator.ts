import { registerDecorator } from "class-validator";

export function IsPgId() {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: "isPgId",
      target: target.constructor,
      propertyName,
      validator: {
        validate: (value: unknown) =>
          typeof value === "string" &&
          /^[1-9]\d{0,18}$/.test(value) &&
          BigInt(value) <= 9223372036854775807n,
        defaultMessage: () =>
          `${propertyName} debe ser un bigint positivo representado como texto`,
      },
    });
}
