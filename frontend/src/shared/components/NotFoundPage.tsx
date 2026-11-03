import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="empty-state">
      <h1>Página no encontrada</h1>
      <p>La dirección solicitada no pertenece a este sistema.</p>
      <Link className="button primary" to="/beneficiarias">Volver a Beneficiarias</Link>
    </section>
  );
}
