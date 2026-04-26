import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
	actualizarCampana,
	asignarAfiliadoACampana,
	desasignarAfiliadoDeCampana,
	listarAfiliadosOptionModel,
	obtenerCampanaDetalleModel,
	validarCampanaUpdateDesdeFormData,
} from "../models/campana/campana.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const campanaId = String(params.campanaId || "");

  const [campana, afiliados] = await Promise.all([
    obtenerCampanaDetalleModel(campanaId, tienda.id),
    listarAfiliadosOptionModel(tienda.id),
  ]);

  if (!campana) {
    throw new Response("Campana no encontrada", { status: 404 });
  }

  return { campana, afiliados };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const campanaId = String(params.campanaId || "");
  const formData = await request.formData();
  const intent = String(formData.get("_action") || "");

  if (!campanaId) {
    return { ok: false, mensaje: "Campana invalida." } satisfies ActionData;
  }

  try {
    if (intent === "editar_campana") {
      const validacion = validarCampanaUpdateDesdeFormData(formData);
      if (!validacion.ok) {
        return { ok: false, mensaje: validacion.mensaje } satisfies ActionData;
      }

      await actualizarCampana(campanaId, tienda.id, validacion.data);
      return redirect("/app/campanas?ok=Campana+actualizada");
    }

    if (intent === "asignar_afiliado") {
      const afiliadoId = String(formData.get("afiliadoId") || "");
      if (!afiliadoId) {
        return { ok: false, mensaje: "Selecciona un afiliado." } satisfies ActionData;
      }

      await asignarAfiliadoACampana(campanaId, afiliadoId);
      return redirect(`/app/campanas/${campanaId}?ok=Afiliado+asignado`);
    }

    if (intent === "desasignar_afiliado") {
      const afiliadoId = String(formData.get("afiliadoId") || "");
      if (!afiliadoId) {
        return { ok: false, mensaje: "Afiliado invalido." } satisfies ActionData;
      }

      await desasignarAfiliadoDeCampana(campanaId, afiliadoId);
      return redirect(`/app/campanas/${campanaId}?ok=Afiliado+retirado`);
    }

    return { ok: false, mensaje: "Accion no soportada." } satisfies ActionData;
  } catch {
    return { ok: false, mensaje: "No se pudo completar la accion." } satisfies ActionData;
  }
};

export default function AppCampanaEditRoute() {
  const { campana, afiliados } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Form method="post">
        <input type="hidden" name="_action" value="editar_campana" />
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Nombre
            <input name="nombre" required minLength={3} maxLength={120} defaultValue={campana.nombre} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Codigo (solo lectura)
            <input value={campana.codigo} readOnly />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Fecha inicio
            <input name="fechaInicio" type="date" required defaultValue={campana.fechaInicio} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Fecha fin
            <input name="fechaFin" type="date" defaultValue={campana.fechaFin} />
          </label>
        </div>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
            Descripcion
            <textarea name="descripcion" rows={4} maxLength={500} defaultValue={campana.descripcion || ""} />
          </label>
          <label style={{ display: "grid", gap: 6, fontWeight: 600, maxWidth: 260 }}>
            Estado
            <select name="estado" defaultValue={String(campana.estado)}>
              <option value="0">BORRADOR</option>
              <option value="1">ACTIVA</option>
              <option value="2">PAUSADA</option>
              <option value="3">FINALIZADA</option>
            </select>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <Link to="/app/campanas" style={{ textDecoration: "none" }}>
              Volver al listado
            </Link>
            <button type="submit">Guardar cambios</button>
          </div>
        </div>
      </Form>

      <div style={{ borderTop: "1px solid #ececec", paddingTop: 12, display: "grid", gap: 12 }}>
        <Form method="post">
          <input type="hidden" name="_action" value="asignar_afiliado" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6, minWidth: 260, flex: "1 1 260px", fontWeight: 600 }}>
              Asignar afiliado
              <select name="afiliadoId" required>
                <option value="">Selecciona afiliado</option>
                {afiliados.map((afiliado) => (
                  <option key={afiliado.id} value={afiliado.id}>
                    {afiliado.codigo} - {afiliado.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Asignar</button>
          </div>
        </Form>

        {campana.afiliados.length === 0 ? (
          <p style={{ color: "#616161" }}>Sin afiliados asignados.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {campana.afiliados.map((afiliado) => (
              <div
                key={afiliado.id}
                style={{
                  border: "1px solid #ececec",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  {afiliado.codigo} - {afiliado.nombre}
                </span>
                <Form method="post">
                  <input type="hidden" name="_action" value="desasignar_afiliado" />
                  <input type="hidden" name="afiliadoId" value={afiliado.afiliadoId} />
                  <button type="submit" style={{ border: "none", background: "none", color: "#b42318" }}>
                    Quitar
                  </button>
                </Form>
              </div>
            ))}
          </div>
        )}
      </div>

      {actionData?.mensaje ? <p style={{ color: "#b42318" }}>{actionData.mensaje}</p> : null}
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
