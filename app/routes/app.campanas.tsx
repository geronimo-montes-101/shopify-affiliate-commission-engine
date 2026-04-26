import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useSearchParams } from "react-router";
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
  const estadoNumero =
    estadoRaw === null || estadoRaw === "" ? undefined : Number.parseInt(estadoRaw, 10);

  const whereCampana: { tiendaId: string; estado?: number } = { tiendaId: tienda.id };
  if (Number.isInteger(estadoNumero)) {
    whereCampana.estado = estadoNumero;
  }

  const [campanas, afiliados] = await Promise.all([
    prisma.campana.findMany({
      where: whereCampana,
      include: {
        afiliados: {
          include: {
            afiliado: true,
          },
        },
      },
      orderBy: { fechaInicio: "desc" },
    }),
    prisma.afiliado.findMany({
      where: { tiendaId: tienda.id },
      orderBy: { creadoEn: "desc" },
    }),
  ]);

  return {
    campanas,
    afiliados,
    filtroEstado: Number.isInteger(estadoNumero) ? estadoNumero : null,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const formData = await request.formData();
  const intent = String(formData.get("_action") || "");

  try {
    if (intent === "crear_campana") {
      const nombre = String(formData.get("nombre") || "").trim();
      const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
      const descripcion = String(formData.get("descripcion") || "").trim() || null;
      const fechaInicioRaw = String(formData.get("fechaInicio") || "");
      const fechaFinRaw = String(formData.get("fechaFin") || "");

      if (!nombre || !codigo || !fechaInicioRaw) {
        return {
          ok: false,
          mensaje: "Nombre, codigo y fecha de inicio son obligatorios.",
        } satisfies ActionData;
      }

      await prisma.campana.create({
        data: {
          tiendaId: tienda.id,
          nombre,
          codigo,
          descripcion,
          fechaInicio: new Date(fechaInicioRaw),
          fechaFin: fechaFinRaw ? new Date(fechaFinRaw) : null,
          estado: ESTADO_CAMPANA.ACTIVA,
        },
      });

      return { ok: true, mensaje: "Campana creada correctamente." } satisfies ActionData;
    }

    if (intent === "editar_campana") {
      const campanaId = String(formData.get("campanaId") || "");
      const nombre = String(formData.get("nombre") || "").trim();
      const descripcion = String(formData.get("descripcion") || "").trim() || null;
      const fechaInicioRaw = String(formData.get("fechaInicio") || "");
      const fechaFinRaw = String(formData.get("fechaFin") || "");
      const estado = Number(String(formData.get("estado") || ESTADO_CAMPANA.ACTIVA));

      if (!campanaId || !nombre || !fechaInicioRaw || Number.isNaN(estado)) {
        return {
          ok: false,
          mensaje: "Datos incompletos para editar campana.",
        } satisfies ActionData;
      }

      await prisma.campana.update({
        where: { id: campanaId },
        data: {
          nombre,
          descripcion,
          fechaInicio: new Date(fechaInicioRaw),
          fechaFin: fechaFinRaw ? new Date(fechaFinRaw) : null,
          estado,
        },
      });

      return { ok: true, mensaje: "Campana actualizada correctamente." } satisfies ActionData;
    }

    if (intent === "asignar_afiliado") {
      const campanaId = String(formData.get("campanaId") || "");
      const afiliadoId = String(formData.get("afiliadoId") || "");

      if (!campanaId || !afiliadoId) {
        return { ok: false, mensaje: "Campana y afiliado son obligatorios." } satisfies ActionData;
      }

      await prisma.campanaAfiliado.upsert({
        where: {
          campanaId_afiliadoId: { campanaId, afiliadoId },
        },
        update: {},
        create: { campanaId, afiliadoId },
      });

      return { ok: true, mensaje: "Afiliado asignado a campana." } satisfies ActionData;
    }

    if (intent === "desasignar_afiliado") {
      const campanaId = String(formData.get("campanaId") || "");
      const afiliadoId = String(formData.get("afiliadoId") || "");

      if (!campanaId || !afiliadoId) {
        return { ok: false, mensaje: "Campana y afiliado son obligatorios." } satisfies ActionData;
      }

      await prisma.campanaAfiliado.delete({
        where: {
          campanaId_afiliadoId: { campanaId, afiliadoId },
        },
      });

      return { ok: true, mensaje: "Afiliado desasignado de campana." } satisfies ActionData;
    }

    if (intent === "eliminar_campana") {
      const campanaId = String(formData.get("campanaId") || "");
      if (!campanaId) {
        return { ok: false, mensaje: "Campana invalida." } satisfies ActionData;
      }

      await prisma.campana.delete({ where: { id: campanaId } });
      return { ok: true, mensaje: "Campana eliminada." } satisfies ActionData;
    }

    return { ok: false, mensaje: "Accion no soportada." } satisfies ActionData;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { ok: false, mensaje: "Ya existe una campana con ese codigo." } satisfies ActionData;
    }

    return { ok: false, mensaje: "No se pudo completar la accion." } satisfies ActionData;
  }
};

export default function AppCampanasRoute() {
  const { campanas, afiliados, filtroEstado } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  return (
    <s-page heading="Campanas">
      <s-section heading="Nueva campana">
        <Form method="post">
          <input type="hidden" name="_action" value="crear_campana" />
          <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
            <label>
              Nombre
              <input name="nombre" required placeholder="Black Friday 2026" />
            </label>
            <label>
              Codigo
              <input name="codigo" required placeholder="BLACKFRIDAY-2026" />
            </label>
            <label>
              Descripcion
              <input name="descripcion" placeholder="Campana de temporada" />
            </label>
            <label>
              Fecha inicio
              <input name="fechaInicio" type="date" required />
            </label>
            <label>
              Fecha fin (opcional)
              <input name="fechaFin" type="date" />
            </label>
            <button type="submit">Crear campana</button>
          </div>
        </Form>
        {actionData?.mensaje ? <s-paragraph>{actionData.mensaje}</s-paragraph> : null}
      </s-section>

      <s-section heading="Filtro por estado">
        <Form method="get">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              name="estado"
              defaultValue={filtroEstado === null ? "" : String(filtroEstado)}
            >
              <option value="">Todas</option>
              <option value={String(ESTADO_CAMPANA.BORRADOR)}>BORRADOR</option>
              <option value={String(ESTADO_CAMPANA.ACTIVA)}>ACTIVA</option>
              <option value={String(ESTADO_CAMPANA.PAUSADA)}>PAUSADA</option>
              <option value={String(ESTADO_CAMPANA.FINALIZADA)}>FINALIZADA</option>
            </select>
            <button type="submit">Filtrar</button>
            {searchParams.get("estado") ? <a href="/app/campanas">Limpiar</a> : null}
          </div>
        </Form>
      </s-section>

      <s-section heading="Gestion de afiliados por campana">
        {campanas.length === 0 ? (
          <s-paragraph>No hay campanas registradas.</s-paragraph>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {campanas.map((campana) => (
              <div
                key={campana.id}
                style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}
              >
                <s-heading>{campana.nombre}</s-heading>
                <s-paragraph>
                  Codigo: {campana.codigo} | Estado: {etiquetaEstadoCampana(campana.estado)}
                </s-paragraph>

                <Form method="post">
                  <input type="hidden" name="_action" value="editar_campana" />
                  <input type="hidden" name="campanaId" value={campana.id} />
                  <div style={{ display: "grid", gap: 8, maxWidth: 560, marginBottom: 12 }}>
                    <label>
                      Nombre
                      <input name="nombre" required defaultValue={campana.nombre} />
                    </label>
                    <label>
                      Descripcion
                      <input name="descripcion" defaultValue={campana.descripcion || ""} />
                    </label>
                    <label>
                      Fecha inicio
                      <input
                        name="fechaInicio"
                        type="date"
                        required
                        defaultValue={campana.fechaInicio.toISOString().slice(0, 10)}
                      />
                    </label>
                    <label>
                      Fecha fin
                      <input
                        name="fechaFin"
                        type="date"
                        defaultValue={
                          campana.fechaFin ? campana.fechaFin.toISOString().slice(0, 10) : ""
                        }
                      />
                    </label>
                    <label>
                      Estado
                      <select name="estado" defaultValue={String(campana.estado)}>
                        <option value={String(ESTADO_CAMPANA.BORRADOR)}>BORRADOR</option>
                        <option value={String(ESTADO_CAMPANA.ACTIVA)}>ACTIVA</option>
                        <option value={String(ESTADO_CAMPANA.PAUSADA)}>PAUSADA</option>
                        <option value={String(ESTADO_CAMPANA.FINALIZADA)}>FINALIZADA</option>
                      </select>
                    </label>
                    <button type="submit">Guardar cambios</button>
                  </div>
                </Form>

                <Form method="post">
                  <input type="hidden" name="_action" value="asignar_afiliado" />
                  <input type="hidden" name="campanaId" value={campana.id} />
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select name="afiliadoId" required>
                      <option value="">Selecciona afiliado</option>
                      {afiliados.map((afiliado) => (
                        <option key={afiliado.id} value={afiliado.id}>
                          {afiliado.codigo} - {afiliado.nombre}
                        </option>
                      ))}
                    </select>
                    <button type="submit">Asignar</button>
                  </div>
                </Form>

                <s-unordered-list>
                  {campana.afiliados.length === 0 ? (
                    <s-list-item>Sin afiliados asignados.</s-list-item>
                  ) : (
                    campana.afiliados.map((registro) => (
                      <s-list-item key={registro.id}>
                        {registro.afiliado.codigo} - {registro.afiliado.nombre}{" "}
                        <Form method="post" style={{ display: "inline-block", marginLeft: 8 }}>
                          <input type="hidden" name="_action" value="desasignar_afiliado" />
                          <input type="hidden" name="campanaId" value={campana.id} />
                          <input type="hidden" name="afiliadoId" value={registro.afiliadoId} />
                          <button type="submit">Quitar</button>
                        </Form>
                      </s-list-item>
                    ))
                  )}
                </s-unordered-list>

                <Form method="post">
                  <input type="hidden" name="_action" value="eliminar_campana" />
                  <input type="hidden" name="campanaId" value={campana.id} />
                  <button type="submit">Eliminar campana</button>
                </Form>
              </div>
            ))}
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
