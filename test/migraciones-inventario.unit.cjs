const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { verificar } = require("../scripts/verificar-migraciones.cjs");
const manifest = require("../database/migrations/manifest.json");
const root = path.resolve(__dirname, "..");

test("Migraciones: inventario íntegro, numeración única y consecutiva", () => {
  assert.deepEqual(verificar(root), {
    inventarioValido: true,
    total: 23,
    estadoBD: "NO_VERIFICADO",
  });
});
test("Migraciones: un nombre histórico con hash válido no se presenta como pendiente", () => {
  for (const migracion of manifest.migraciones)
    for (const anterior of migracion.antecedentes) {
      const resultado = verificar(root, { aplicadas: [anterior] });
      assert.deepEqual(resultado.reconocidas, [migracion.archivo]);
      assert.ok(!resultado.porRevisar.includes(migracion.archivo));
    }
});
test("Migraciones: rechaza hash alterado, nombre desconocido y duplicación por renombre", () => {
  const migracion = manifest.migraciones.find((m) => m.antecedentes.length);
  assert.throws(
    () =>
      verificar(root, {
        aplicadas: [{ archivo: migracion.archivo, sha256: "incorrecto" }],
      }),
    /no reconocido/,
  );
  assert.throws(
    () =>
      verificar(root, {
        aplicadas: [{ archivo: "desconocido.sql", sha256: "incorrecto" }],
      }),
    /no reconocido/,
  );
  assert.throws(
    () =>
      verificar(root, {
        aplicadas: [
          migracion.antecedentes[0],
          { archivo: migracion.archivo, sha256: migracion.sha256 },
        ],
      }),
    /duplicado/,
  );
});
test("Migraciones: el nuevo orden conserva la secuencia histórica de dependencias", () => {
  const anteriores = manifest.migraciones
    .filter((m) => !m.archivo.startsWith("024_"))
    .map((m) => m.antecedentes[0]?.archivo ?? m.archivo);
  assert.deepEqual(anteriores, [...anteriores].sort());
});
