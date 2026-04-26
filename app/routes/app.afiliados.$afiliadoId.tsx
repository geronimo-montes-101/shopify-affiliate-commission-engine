import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

function normalizarCodigo(valor: FormDataEntryValue | null) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

function parsearTasaComision(valor: FormDataEntryValue | null) {
  const porcentaje = Number.parseFloat(String(valor || ""));
  if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) return null;
  return (porcentaje / 100).toFixed(4);
}

function emailValido(email: string | null) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const afiliadoId = String(params.afiliadoId || "");

  const afiliado = await prisma.afiliado.findFirst({
    where: { id: afiliadoId, tiendaId: tienda.id },
  });

  if (!afiliado) {
    throw new Response("Afiliado no encontrado", { status: 404 });
  }

  return {
    afiliado: {
      id: afiliado.id,
      nombre: afiliado.nombre,
      codigo: afiliado.codigo,
      email: afiliado.email,
      estado: afiliado.estado,
      tasaComision: Number(afiliado.tasaComision) * 100,
    },
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const afiliadoId = String(params.afiliadoId || "");
  const formData = await request.formData();

  const nombre = String(formData.get("nombre") || "").trim();
  const codigo = normalizarCodigo(formData.get("codigo"));
  const email = String(formData.get("email") || "").trim() || null;
  const tasaComision = parsearTasaComision(formData.get("tasaComision"));
  const estado = Number.parseInt(String(formData.get("estado") || "1"), 10);

  if (!afiliadoId || !nombre || !codigo || tasaComision === null || !Number.isInteger(estado)) {
    return { ok: false, mensaje: "Completa todos los campos requeridos." } satisfies ActionData;
  }
  if (!emailValido(email)) {
    return { ok: false, mensaje: "El email no tiene un formato valido." } satisfies ActionData;
  }

  try {
    await prisma.afiliado.updateMany({
      where: { id: afiliadoId, tiendaId: tienda.id },
      data: { nombre, codigo, email, tasaComision, estado },
    });
    return redirect("/app/afiliados?ok=Afiliado+actualizado");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { ok: false, mensaje: "Ya existe un afiliado con ese codigo." } satisfies ActionData;
    }
    return { ok: false, mensaje: "No se pudo actualizar el afiliado." } satisfies ActionData;
  }
};

export default function AppAfiliadoEditRoute() {
  const { afiliado } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 16, background: "#fff" }}>
      <Form method="post">
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
              Nombre
              <input name="nombre" required minLength={3} maxLength={80} defaultValue={afiliado.nombre} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
              Codigo
              <input
                name="codigo"
                required
                minLength={3}
                maxLength={40}
                pattern="[A-Za-z0-9\-_ ]+"
                defaultValue={afiliado.codigo}
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
              Email
              <input name="email" type="email" maxLength={120} defaultValue={afiliado.email || ""} />
            </label>
            <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
              Comision (%)
              <input
                name="tasaComision"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                defaultValue={afiliado.tasaComision}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6, maxWidth: 260, fontWeight: 600 }}>
            Estado
            <select name="estado" defaultValue={String(afiliado.estado)}>
              <option value="0">INACTIVO</option>
              <option value="1">ACTIVO</option>
              <option value="2">SUSPENDIDO</option>
            </select>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Link to="/app/afiliados" style={{ textDecoration: "none" }}>
              Volver al listado
            </Link>
            <button type="submit">Guardar cambios</button>
          </div>
        </div>
      </Form>
      {actionData?.mensaje ? <p style={{ marginTop: 12, color: "#b42318" }}>{actionData.mensaje}</p> : null}
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
