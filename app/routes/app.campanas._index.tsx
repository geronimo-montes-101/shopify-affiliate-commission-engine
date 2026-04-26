import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

const ESTADO_CAMPANA = {
  BORRADOR: 0,
  ACTIVA: 1,
  PAUSADA: 2,
  FINALIZADA: 3,
} as const;

function etiquetaEstadoCampana(estado: number) {
  if (estado === ESTADO_CAMPANA.BORRADOR) return "BORRADOR";
  if (estado === ESTADO_CAMPANA.ACTIVA) return "ACTIVA";
  if (estado === ESTADO_CAMPANA.PAUSADA) return "PAUSADA";
  if (estado === ESTADO_CAMPANA.FINALIZADA) return "FINALIZADA";
  return `DESCONOCIDO (${estado})`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const url = new URL(request.url);
  const estadoRaw = url.searchParams.get("estado");
  const estadoNumero = estadoRaw ? Number.parseInt(estadoRaw, 10) : undefined;

  const campanas = await prisma.campana.findMany({
    where: {
      tiendaId: tienda.id,
      ...(Number.isInteger(estadoNumero) ? { estado: estadoNumero } : {}),
    },
    include: {
      _count: {
        select: { afiliados: true },
      },
    },
    orderBy: { fechaInicio: "desc" },
  });

  return {
    campanas: campanas.map((campana) => ({
      id: campana.id,
      nombre: campana.nombre,
      codigo: campana.codigo,
      estado: campana.estado,
      fechaInicio: campana.fechaInicio.toISOString(),
      fechaFin: campana.fechaFin ? campana.fechaFin.toISOString() : null,
      afiliadosCount: campana._count.afiliados,
    })),
    filtroEstado: Number.isInteger(estadoNumero) ? estadoNumero : null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = String(formData.get("_action") || "");

  if (intent !== "eliminar_campana") {
    return { ok: false, mensaje: "Accion no soportada." } satisfies ActionData;
  }

  const campanaId = String(formData.get("campanaId") || "");
  if (!campanaId) {
    return { ok: false, mensaje: "Campana invalida." } satisfies ActionData;
  }

  try {
    await prisma.campana.delete({ where: { id: campanaId } });
    return redirect("/app/campanas?ok=Campana+eliminada");
  } catch {
    return { ok: false, mensaje: "No se pudo eliminar la campana." } satisfies ActionData;
  }
};

export default function AppCampanasListRoute() {
  const { campanas, filtroEstado } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <style>
        {`
          .campanas-table-wrap { display: none; overflow-x: auto; }
          .campanas-cards { display: grid; gap: 12px; }
          @media (min-width: 900px) {
            .campanas-table-wrap { display: block; }
            .campanas-cards { display: none; }
          }
        `}
      </style>

      <Form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: 6, fontWeight: 600 }}>
          Estado
          <select name="estado" defaultValue={filtroEstado === null ? "" : String(filtroEstado)}>
            <option value="">Todas</option>
            <option value="0">BORRADOR</option>
            <option value="1">ACTIVA</option>
            <option value="2">PAUSADA</option>
            <option value="3">FINALIZADA</option>
          </select>
        </label>
        <button type="submit">Filtrar</button>
        {searchParams.get("estado") ? (
          <Link to="/app/campanas" style={{ textDecoration: "none" }}>
            Limpiar
          </Link>
        ) : null}
      </Form>

      {actionData?.mensaje ? <p style={{ color: "#b42318" }}>{actionData.mensaje}</p> : null}

      <div className="campanas-table-wrap" style={{ border: "1px solid #d9d9d9", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f7f7f7" }}>
              <th style={{ padding: 12 }}>Campana</th>
              <th style={{ padding: 12 }}>Codigo</th>
              <th style={{ padding: 12 }}>Vigencia</th>
              <th style={{ padding: 12 }}>Afiliados</th>
              <th style={{ padding: 12 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {campanas.map((campana) => (
              <tr key={campana.id} style={{ borderTop: "1px solid #ececec" }}>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong>{campana.nombre}</strong>
                    <span style={{ color: "#616161", fontSize: 13 }}>{etiquetaEstadoCampana(campana.estado)}</span>
                  </div>
                </td>
                <td style={{ padding: 12 }}>{campana.codigo}</td>
                <td style={{ padding: 12 }}>
                  {campana.fechaInicio.slice(0, 10)}
                  {campana.fechaFin ? ` - ${campana.fechaFin.slice(0, 10)}` : ""}
                </td>
                <td style={{ padding: 12 }}>{campana.afiliadosCount}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Link to={`/app/campanas/${campana.id}`} style={{ textDecoration: "none" }}>
                      Editar
                    </Link>
                    <Form method="post">
                      <input type="hidden" name="_action" value="eliminar_campana" />
                      <input type="hidden" name="campanaId" value={campana.id} />
                      <button type="submit" style={{ border: "none", background: "none", color: "#b42318" }}>
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

      <div className="campanas-cards">
        {campanas.map((campana) => (
          <div
            key={campana.id}
            style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12, background: "#fff" }}
          >
            <strong>{campana.nombre}</strong>
            <div style={{ display: "grid", gap: 4, margin: "8px 0 12px 0", fontSize: 14 }}>
              <span>Codigo: {campana.codigo}</span>
              <span>Estado: {etiquetaEstadoCampana(campana.estado)}</span>
              <span>Afiliados: {campana.afiliadosCount}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/app/campanas/${campana.id}`} style={{ textDecoration: "none" }}>
                Editar
              </Link>
              <Form method="post">
                <input type="hidden" name="_action" value="eliminar_campana" />
                <input type="hidden" name="campanaId" value={campana.id} />
                <button type="submit" style={{ border: "none", background: "none", color: "#b42318" }}>
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
