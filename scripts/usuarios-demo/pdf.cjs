const fs = require("node:fs");
const path = require("node:path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { ErrorDemo } = require("./plan.cjs");

function lineas(texto, font, size, width) {
  const partes = String(texto).split(/\s+/),
    resultado = [];
  let actual = "";
  for (const palabra of partes) {
    if (
      font.widthOfTextAtSize((actual ? actual + " " : "") + palabra, size) <=
      width
    ) {
      actual += (actual ? " " : "") + palabra;
      continue;
    }
    if (actual) resultado.push(actual);
    actual = "";
    for (const letra of palabra) {
      if (font.widthOfTextAtSize(actual + letra, size) > width) {
        resultado.push(actual);
        actual = "";
      }
      actual += letra;
    }
  }
  if (actual) resultado.push(actual);
  return resultado;
}
/** Los permisos proceden de la matriz existente, no de una promesa de autorización integral. */
async function generarPdf(carpeta) {
  if (carpeta.data.estado !== "CONFIRMADO")
    throw new ErrorDemo("No se genera un PDF de cuentas sin confirmar.");
  const filename = path.join(carpeta.dir, "credenciales-demo.pdf");
  if (fs.existsSync(filename)) {
    if (fs.lstatSync(filename).isSymbolicLink())
      throw new ErrorDemo("El PDF no puede ser un enlace.");
    return filename;
  }
  const pdf = await PDFDocument.create(),
    normal = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold),
    mono = await pdf.embedFont(StandardFonts.Courier);
  const margen = 36,
    widths = [150, 155, 415];
  let page,
    y,
    pagina = 0;
  const texto = (t, x, yy, font = normal, size = 10) =>
    page.drawText(t, { x, y: yy, font, size, color: rgb(0, 0, 0) });
  function nuevaPagina() {
    page = pdf.addPage([792, 612]);
    pagina++;
    y = 476;
    texto("Nuevos Horizontes - cuentas de demostración", margen, 574, bold, 16);
    texto(
      `Base: ${carpeta.data.destino.database} - página ${pagina}`,
      margen,
      554,
      normal,
      9,
    );
    texto(
      "Privado. Contiene contraseñas. No subir a GitHub ni proyectar esta tabla ante el público.",
      margen,
      535,
      normal,
      9,
    );
    texto(
      "Permisos asignados en BD; no certifican controles de área aún pendientes en la aplicación.",
      margen,
      520,
      normal,
      9,
    );
    page.drawRectangle({
      x: margen,
      y: 488,
      width: 720,
      height: 22,
      color: rgb(0.92, 0.92, 0.92),
    });
    ["Usuario", "Contraseña", "Perfil y permisos asignados"].forEach((t, i) =>
      texto(
        t,
        margen + widths.slice(0, i).reduce((a, b) => a + b, 0) + 7,
        495,
        bold,
        10,
      ),
    );
  }
  nuevaPagina();
  for (const c of carpeta.data.cuentas) {
    const detalle = `${c.perfil}${c.area ? " - " + c.area : ""}. ${c.permisos.map((p) => p.replaceAll("_", " ").replace(":", ": ")).join("; ")}.${c.cambioObligatorio ? " Debe cambiar la contraseña al ingresar." : ""}`;
    const ls = lineas(detalle, normal, 10, widths[2] - 14);
    for (let desde = 0; desde < ls.length; desde += 28) {
      const fragmento = ls.slice(desde, desde + 28),
        height = Math.max(42, fragmento.length * 12 + 16);
      if (y - height < 36) nuevaPagina();
      let x = margen;
      for (const w of widths) {
        page.drawRectangle({
          x,
          y: y - height,
          width: w,
          height,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });
        x += w;
      }
      texto(c.usuario, margen + 7, y - 17, normal, 10);
      texto(
        desde ? "(continuación)" : c.contrasena,
        margen + widths[0] + 7,
        y - 17,
        mono,
        9.5,
      );
      fragmento.forEach((l, i) =>
        texto(l, margen + widths[0] + widths[1] + 7, y - 17 - i * 12),
      );
      y -= height;
    }
  }
  fs.writeFileSync(filename, await pdf.save(), { flag: "wx", mode: 0o600 });
  return filename;
}
module.exports = { generarPdf };
