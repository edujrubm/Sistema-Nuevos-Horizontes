import { registerDecorator, ValidationOptions } from "class-validator";

export function IsPgId(options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: "isPgId",
      target: target.constructor,
      propertyName,
      options,
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
