const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const nombreAnterior = new RegExp("persona" + "[ _-]?3|\\bp" + "3(?:[_-]|\\b)", "i");

function archivos(relative) {
  const absolute = path.join(root, relative);
  if (fs.statSync(absolute).isFile()) return [relative];
  return fs.readdirSync(absolute).flatMap((name) => archivos(path.join(relative, name)));
}

test("Los módulos activos y sus herramientas usan nombres de dominio", () => {
  const rutas = ["src", "frontend/src", "scripts", "test", "postman", "package.json", ".env.example"]
    .flatMap(archivos);
  const fallos = [];
  for (const relative of rutas) {
    if (nombreAnterior.test(relative)) fallos.push(relative);
    if (!/\.(?:ts|tsx|cjs|json|md|ps1|sql|css)$|\.env\.example$/.test(relative)) continue;
    if (nombreAnterior.test(fs.readFileSync(path.join(root, relative), "utf8"))) fallos.push(relative);
  }
  assert.deepEqual(fallos, [], "Se encontró una dependencia de la agrupación anterior.");
});

test("La infraestructura de formularios no importa repositorios privados de Legal o Social", () => {
  for (const relative of archivos("src/modules/formularios/shared")) {
    if (!relative.endsWith(".ts")) continue;
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    assert.doesNotMatch(text, /(?:from|import\()\s*["'][^"']*\.\.\/(?:legal|social)\//, relative);
  }
});
