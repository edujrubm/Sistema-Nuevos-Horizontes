import { validate } from "class-validator";
import { FichaSocialDetalleDto } from "./ficha-social.dto";

describe("Identificador del área de coordinación de Social", () => {
  it.each([undefined, null, "1", "9223372036854775807"])(
    "admite el valor opcional o bigint válido %s",
    async areaCoordinacionId => {
      const dto = Object.assign(new FichaSocialDetalleDto(), { areaCoordinacionId });
      expect(await validate(dto)).toHaveLength(0);
    },
  );

  it.each(["9223372036854775808", "0", "-1", "1.5", "abc", 67])(
    "rechaza %s antes de enviarlo a PostgreSQL",
    async areaCoordinacionId => {
      const dto = Object.assign(new FichaSocialDetalleDto(), { areaCoordinacionId });
      const errors = await validate(dto);
      expect(errors.map(error => error.property)).toContain("areaCoordinacionId");
    },
  );
});
