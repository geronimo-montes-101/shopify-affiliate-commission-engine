import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { Form, Link, redirect, useActionData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

function codigoValido(codigo: string) {
  return /^[A-Z0-9\-_]+$/.test(codigo);
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const formData = await request.formData();

  const nombre = String(formData.get("nombre") || "").trim();
  const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const fechaInicioRaw = String(formData.get("fechaInicio") || "");
  const fechaFinRaw = String(formData.get("fechaFin") || "");

  if (!nombre || nombre.length < 3) {
    return { ok: false, mensaje: "El nombre debe tener al menos 3 caracteres." } satisfies ActionData;
  }
  if (!codigo || !codigoValido(codigo)) {
    return { ok: false, mensaje: "El codigo solo acepta A-Z, 0-9, guion y guion bajo." } satisfies ActionData;
  }
  if (!fechaInicioRaw) {
    return { ok: false, mensaje: "La fecha de inicio es obligatoria." } satisfies ActionData;
  }
  if (fechaFinRaw && new Date(fechaFinRaw) < new Date(fechaInicioRaw)) {
    return { ok: false, mensaje: "La fecha de fin no puede ser anterior al inicio." } satisfies ActionData;
  }

  try {
    await prisma.campana.create({
      data: {
        tiendaId: tienda.id,
        nombre,
        codigo,
        descripcion,
        fechaInicio: new Date(fechaInicioRaw),
        fechaFin: fechaFinRaw ? new Date(fechaFinRaw) : null,
        estado: 1,
      },
    });
    return redirect("/app/campanas?ok=Campana+creada");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { ok: false, mensaje: "Ya existe una campana con ese codigo." } satisfies ActionData;
    }
    return { ok: false, mensaje: "No se pudo crear la campana." } satisfies ActionData;
  }
};

export default function AppCampanaNuevaRoute() {
  const actionData = useActionData<typeof action>();

  return (
    <Form method="post">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Nombre
            <input name="nombre" required minLength={3} maxLength={120} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Codigo
            <input
              name="codigo"
              required
              pattern="[A-Za-z0-9\-_]+"
              title="Solo letras, numeros, guion y guion bajo."
              maxLength={40}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Fecha inicio
            <input name="fechaInicio" type="date" required />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Fecha fin
            <input name="fechaFin" type="date" />
          </label>
        </div>
        <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
          Descripcion
          <textarea name="descripcion" rows={4} maxLength={500} />
        </label>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link to="/app/campanas" style={{ textDecoration: "none" }}>
            Volver al listado
          </Link>
          <button type="submit">Crear campana</button>
        </div>
      </div>
      {actionData?.mensaje ? <p style={{ marginTop: 12, color: "#b42318" }}>{actionData.mensaje}</p> : null}
    </Form>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
