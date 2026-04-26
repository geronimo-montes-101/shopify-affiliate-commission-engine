import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import type { CSSProperties } from "react";
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

const surfaceStyle: CSSProperties = {
  border: "1px solid #d9d9d9",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const fieldLabelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#303030",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  minHeight: 40,
  padding: "10px 12px",
  border: "1px solid #c9cccf",
  borderRadius: 8,
  fontSize: 14,
  lineHeight: 1.4,
  boxSizing: "border-box",
  background: "#ffffff",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 40,
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1f1f1f",
  background: "#1f1f1f",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "#ffffff",
  color: "#1f1f1f",
  border: "1px solid #c9cccf",
};

const dangerButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  color: "#8e1f0b",
  border: "1px solid #d9b5af",
  background: "#fff5f5",
};

const pillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 28,
  padding: "4px 10px",
  borderRadius: 999,
  background: "#f1f2f3",
  color: "#303030",
  fontSize: 13,
  fontWeight: 600,
};

const helperStyle: CSSProperties = {
  color: "#616161",
  fontSize: 13,
  margin: 0,
};

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
        <div style={surfaceStyle}>
          <Form method="post">
            <input type="hidden" name="_action" value="crear_campana" />
            <div style={formGridStyle}>
              <div style={twoColumnGridStyle}>
                <label style={fieldLabelStyle}>
                  <span>Nombre</span>
                  <input
                    name="nombre"
                    required
                    placeholder="Black Friday 2026"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Codigo</span>
                  <input
                    name="codigo"
                    required
                    placeholder="BLACKFRIDAY-2026"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Descripcion</span>
                  <input
                    name="descripcion"
                    placeholder="Campana de temporada"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Fecha inicio</span>
                  <input name="fechaInicio" type="date" required style={fieldStyle} />
                </label>
              </div>
              <label style={{ ...fieldLabelStyle, maxWidth: 280 }}>
                <span>Fecha fin (opcional)</span>
                <input name="fechaFin" type="date" style={fieldStyle} />
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={helperStyle}>
                  Usa codigos consistentes para medir resultados por temporada o canal.
                </p>
                <button type="submit" style={primaryButtonStyle}>
                  Crear campana
                </button>
              </div>
            </div>
          </Form>
        </div>
        {actionData?.mensaje ? (
          <div
            style={{
              ...surfaceStyle,
              marginTop: 12,
              background: actionData.ok ? "#f1fff3" : "#fff5f5",
              borderColor: actionData.ok ? "#aee9b3" : "#e7b3ad",
            }}
          >
            <s-paragraph>{actionData.mensaje}</s-paragraph>
          </div>
        ) : null}
      </s-section>

      <s-section heading="Filtro por estado">
        <div style={surfaceStyle}>
          <Form method="get">
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "end",
                flexWrap: "wrap",
              }}
            >
              <label style={{ ...fieldLabelStyle, minWidth: 220 }}>
                <span>Estado</span>
                <select
                  name="estado"
                  defaultValue={filtroEstado === null ? "" : String(filtroEstado)}
                  style={fieldStyle}
                >
                  <option value="">Todas</option>
                  <option value={String(ESTADO_CAMPANA.BORRADOR)}>BORRADOR</option>
                  <option value={String(ESTADO_CAMPANA.ACTIVA)}>ACTIVA</option>
                  <option value={String(ESTADO_CAMPANA.PAUSADA)}>PAUSADA</option>
                  <option value={String(ESTADO_CAMPANA.FINALIZADA)}>FINALIZADA</option>
                </select>
              </label>
              <button type="submit" style={secondaryButtonStyle}>
                Filtrar
              </button>
              {searchParams.get("estado") ? (
                <a href="/app/campanas" style={{ ...helperStyle, alignSelf: "center" }}>
                  Limpiar
                </a>
              ) : null}
            </div>
          </Form>
        </div>
      </s-section>

      <s-section heading="Gestion de afiliados por campana">
        {campanas.length === 0 ? (
          <div style={surfaceStyle}>
            <s-paragraph>No hay campanas registradas.</s-paragraph>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {campanas.map((campana) => (
              <div key={campana.id} style={surfaceStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <s-heading>{campana.nombre}</s-heading>
                    <p style={helperStyle}>
                      Vigencia: {campana.fechaInicio.toISOString().slice(0, 10)}
                      {campana.fechaFin ? ` -> ${campana.fechaFin.toISOString().slice(0, 10)}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={pillStyle}>{campana.codigo}</span>
                    <span style={pillStyle}>{etiquetaEstadoCampana(campana.estado)}</span>
                    <span style={pillStyle}>{campana.afiliados.length} afiliados</span>
                  </div>
                </div>

                <Form method="post">
                  <input type="hidden" name="_action" value="editar_campana" />
                  <input type="hidden" name="campanaId" value={campana.id} />
                  <div style={formGridStyle}>
                    <div style={twoColumnGridStyle}>
                      <label style={fieldLabelStyle}>
                        <span>Nombre</span>
                        <input
                          name="nombre"
                          required
                          defaultValue={campana.nombre}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Descripcion</span>
                        <input
                          name="descripcion"
                          defaultValue={campana.descripcion || ""}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Fecha inicio</span>
                        <input
                          name="fechaInicio"
                          type="date"
                          required
                          defaultValue={campana.fechaInicio.toISOString().slice(0, 10)}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Fecha fin</span>
                        <input
                          name="fechaFin"
                          type="date"
                          defaultValue={
                            campana.fechaFin ? campana.fechaFin.toISOString().slice(0, 10) : ""
                          }
                          style={fieldStyle}
                        />
                      </label>
                    </div>
                    <label style={{ ...fieldLabelStyle, maxWidth: 280 }}>
                      <span>Estado</span>
                      <select
                        name="estado"
                        defaultValue={String(campana.estado)}
                        style={fieldStyle}
                      >
                        <option value={String(ESTADO_CAMPANA.BORRADOR)}>BORRADOR</option>
                        <option value={String(ESTADO_CAMPANA.ACTIVA)}>ACTIVA</option>
                        <option value={String(ESTADO_CAMPANA.PAUSADA)}>PAUSADA</option>
                        <option value={String(ESTADO_CAMPANA.FINALIZADA)}>FINALIZADA</option>
                      </select>
                    </label>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button type="submit" style={secondaryButtonStyle}>
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </Form>

                <div
                  style={{
                    borderTop: "1px solid #ececec",
                    marginTop: 16,
                    paddingTop: 16,
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <Form method="post">
                    <input type="hidden" name="_action" value="asignar_afiliado" />
                    <input type="hidden" name="campanaId" value={campana.id} />
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "end",
                        flexWrap: "wrap",
                      }}
                    >
                      <label style={{ ...fieldLabelStyle, minWidth: 260, flex: "1 1 260px" }}>
                        <span>Asignar afiliado</span>
                        <select name="afiliadoId" required style={fieldStyle}>
                          <option value="">Selecciona afiliado</option>
                          {afiliados.map((afiliado) => (
                            <option key={afiliado.id} value={afiliado.id}>
                              {afiliado.codigo} - {afiliado.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="submit" style={secondaryButtonStyle}>
                        Asignar
                      </button>
                    </div>
                  </Form>

                  {campana.afiliados.length === 0 ? (
                    <p style={helperStyle}>Sin afiliados asignados.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {campana.afiliados.map((registro) => (
                        <div
                          key={registro.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                            padding: "10px 12px",
                            border: "1px solid #ececec",
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={pillStyle}>{registro.afiliado.codigo}</span>
                            <span>{registro.afiliado.nombre}</span>
                          </div>
                          <Form method="post">
                            <input type="hidden" name="_action" value="desasignar_afiliado" />
                            <input type="hidden" name="campanaId" value={campana.id} />
                            <input type="hidden" name="afiliadoId" value={registro.afiliadoId} />
                            <button type="submit" style={dangerButtonStyle}>
                              Quitar
                            </button>
                          </Form>
                        </div>
                      ))}
                    </div>
                  )}

                  <Form method="post">
                    <input type="hidden" name="_action" value="eliminar_campana" />
                    <input type="hidden" name="campanaId" value={campana.id} />
                    <button type="submit" style={dangerButtonStyle}>
                      Eliminar campana
                    </button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
