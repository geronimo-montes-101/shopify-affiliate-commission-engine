import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  eliminarAfiliado,
  listarAfiliadosListModel,
  toAfiliadoCardModel,
} from "../models/afiliado/afiliado.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

function etiquetaEstadoAfiliado(estado: number) {
  if (estado === 0) return "INACTIVO";
  if (estado === 1) return "ACTIVO";
  if (estado === 2) return "SUSPENDIDO";
  return `DESCONOCIDO (${estado})`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);

  const afiliadosList = await listarAfiliadosListModel(tienda.id);

  return {
    afiliados: afiliadosList,
    afiliadosCards: afiliadosList.map(toAfiliadoCardModel),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const formData = await request.formData();
  const intent = String(formData.get("_action") || "");

  if (intent !== "eliminar_afiliado") {
    return { ok: false, mensaje: "Accion no soportada." } satisfies ActionData;
  }

  const afiliadoId = String(formData.get("afiliadoId") || "");
  if (!afiliadoId) {
    return { ok: false, mensaje: "Afiliado invalido." } satisfies ActionData;
  }

  try {
    await eliminarAfiliado(afiliadoId, tienda.id);
    return redirect("/app/afiliados?ok=Afiliado+eliminado");
  } catch {
    return { ok: false, mensaje: "No se pudo eliminar el afiliado." } satisfies ActionData;
  }
};

export default function AppAfiliadosListRoute() {
  const { afiliados, afiliadosCards } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <style>
        {`
          .afiliados-table-wrap { display: none; overflow-x: auto; }
          .afiliados-cards { display: grid; gap: 12px; }
          @media (min-width: 900px) {
            .afiliados-table-wrap { display: block; }
            .afiliados-cards { display: none; }
          }
        `}
      </style>

      {actionData?.mensaje ? (
        <div
          style={{
            border: "1px solid #e7b3ad",
            borderRadius: 8,
            padding: 12,
            background: "#fff5f5",
          }}
        >
          <s-paragraph>{actionData.mensaje}</s-paragraph>
        </div>
      ) : null}

      <div className="afiliados-table-wrap" style={{ border: "1px solid #d9d9d9", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#f7f7f7", textAlign: "left" }}>
              <th style={{ padding: 12 }}>Afiliado</th>
              <th style={{ padding: 12 }}>Codigo</th>
              <th style={{ padding: 12 }}>Estado</th>
              <th style={{ padding: 12 }}>Comision</th>
              <th style={{ padding: 12 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {afiliados.map((afiliado) => (
              <tr key={afiliado.id} style={{ borderTop: "1px solid #ececec" }}>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong>{afiliado.nombre}</strong>
                    <span style={{ color: "#616161", fontSize: 13 }}>{afiliado.email || "Sin email"}</span>
                  </div>
                </td>
                <td style={{ padding: 12 }}>{afiliado.codigo}</td>
                <td style={{ padding: 12 }}>{etiquetaEstadoAfiliado(afiliado.estado)}</td>
                <td style={{ padding: 12 }}>{afiliado.tasaComision.toFixed(2)}%</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/app/afiliados/${afiliado.id}`} style={{ textDecoration: "none" }}>
                      Editar
                    </Link>
                    <Form method="post">
                      <input type="hidden" name="_action" value="eliminar_afiliado" />
                      <input type="hidden" name="afiliadoId" value={afiliado.id} />
                      <button
                        type="submit"
                        style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer" }}
                      >
                        Eliminar
                      </button>
                    </Form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="afiliados-cards">
        {afiliadosCards.map((afiliado) => (
          <div
            key={afiliado.id}
            style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12, background: "#fff" }}
          >
            <div style={{ display: "grid", gap: 4, marginBottom: 10 }}>
              <strong>{afiliado.nombre}</strong>
              <span style={{ color: "#616161", fontSize: 13 }}>{afiliado.email || "Sin email"}</span>
            </div>
            <div style={{ display: "grid", gap: 4, marginBottom: 12, fontSize: 14 }}>
              <span>Codigo: {afiliado.codigo}</span>
              <span>Estado: {etiquetaEstadoAfiliado(afiliado.estado)}</span>
              <span>Comision: {afiliado.tasaComision.toFixed(2)}%</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/app/afiliados/${afiliado.id}`} style={{ textDecoration: "none" }}>
                Editar
              </Link>
              <Form method="post">
                <input type="hidden" name="_action" value="eliminar_afiliado" />
                <input type="hidden" name="afiliadoId" value={afiliado.id} />
                <button
                  type="submit"
                  style={{ background: "none", border: "none", color: "#b42318", cursor: "pointer" }}
                >
                  Eliminar
                </button>
              </Form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
