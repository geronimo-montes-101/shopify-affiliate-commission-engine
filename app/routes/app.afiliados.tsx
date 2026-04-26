import type { CSSProperties } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

type ActionData = { ok: boolean; mensaje: string };

const ESTADO_AFILIADO = {
  INACTIVO: 0,
  ACTIVO: 1,
  SUSPENDIDO: 2,
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

const infoRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  marginBottom: 12,
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

function etiquetaEstadoAfiliado(estado: number) {
  if (estado === ESTADO_AFILIADO.INACTIVO) return "INACTIVO";
  if (estado === ESTADO_AFILIADO.ACTIVO) return "ACTIVO";
  if (estado === ESTADO_AFILIADO.SUSPENDIDO) return "SUSPENDIDO";
  return `DESCONOCIDO (${estado})`;
}

function normalizarCodigo(valor: FormDataEntryValue | null) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

function parsearTasaComision(valor: FormDataEntryValue | null) {
  const porcentaje = Number.parseFloat(String(valor || ""));
  if (Number.isNaN(porcentaje)) return null;
  if (porcentaje < 0 || porcentaje > 100) return null;
  return (porcentaje / 100).toFixed(4);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);

  const afiliados = await prisma.afiliado.findMany({
    where: { tiendaId: tienda.id },
    orderBy: { creadoEn: "desc" },
  });

  return {
    afiliados: afiliados.map((afiliado) => ({
      id: afiliado.id,
      codigo: afiliado.codigo,
      nombre: afiliado.nombre,
      email: afiliado.email,
      estado: afiliado.estado,
      tasaComision: Number(afiliado.tasaComision) * 100,
      creadoEn: afiliado.creadoEn.toISOString(),
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);
  const formData = await request.formData();
  const intent = String(formData.get("_action") || "");

  try {
    if (intent === "crear_afiliado") {
      const nombre = String(formData.get("nombre") || "").trim();
      const codigo = normalizarCodigo(formData.get("codigo"));
      const email = String(formData.get("email") || "").trim() || null;
      const tasaComision = parsearTasaComision(formData.get("tasaComision"));
      const estado = Number.parseInt(
        String(formData.get("estado") || ESTADO_AFILIADO.ACTIVO),
        10,
      );

      if (!nombre || !codigo || tasaComision === null || !Number.isInteger(estado)) {
        return {
          ok: false,
          mensaje: "Nombre, codigo, estado y porcentaje valido son obligatorios.",
        } satisfies ActionData;
      }

      await prisma.afiliado.create({
        data: {
          tiendaId: tienda.id,
          nombre,
          codigo,
          email,
          tasaComision,
          estado,
        },
      });

      return { ok: true, mensaje: "Afiliado creado correctamente." } satisfies ActionData;
    }

    if (intent === "editar_afiliado") {
      const afiliadoId = String(formData.get("afiliadoId") || "");
      const nombre = String(formData.get("nombre") || "").trim();
      const codigo = normalizarCodigo(formData.get("codigo"));
      const email = String(formData.get("email") || "").trim() || null;
      const tasaComision = parsearTasaComision(formData.get("tasaComision"));
      const estado = Number.parseInt(
        String(formData.get("estado") || ESTADO_AFILIADO.ACTIVO),
        10,
      );

      if (
        !afiliadoId ||
        !nombre ||
        !codigo ||
        tasaComision === null ||
        !Number.isInteger(estado)
      ) {
        return {
          ok: false,
          mensaje: "Datos incompletos para editar afiliado.",
        } satisfies ActionData;
      }

      await prisma.afiliado.update({
        where: { id: afiliadoId },
        data: {
          nombre,
          codigo,
          email,
          tasaComision,
          estado,
        },
      });

      return { ok: true, mensaje: "Afiliado actualizado correctamente." } satisfies ActionData;
    }

    if (intent === "eliminar_afiliado") {
      const afiliadoId = String(formData.get("afiliadoId") || "");
      if (!afiliadoId) {
        return { ok: false, mensaje: "Afiliado invalido." } satisfies ActionData;
      }

      await prisma.afiliado.delete({ where: { id: afiliadoId } });
      return { ok: true, mensaje: "Afiliado eliminado." } satisfies ActionData;
    }

    return { ok: false, mensaje: "Accion no soportada." } satisfies ActionData;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        ok: false,
        mensaje: "Ya existe un afiliado con ese codigo en esta tienda.",
      } satisfies ActionData;
    }

    return { ok: false, mensaje: "No se pudo completar la accion." } satisfies ActionData;
  }
};

export default function AppAfiliadosRoute() {
  const { afiliados } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <s-page heading="Afiliados">
      <s-section heading="Nuevo afiliado">
        <div style={surfaceStyle}>
          <Form method="post">
            <input type="hidden" name="_action" value="crear_afiliado" />
            <div style={formGridStyle}>
              <div style={twoColumnGridStyle}>
                <label style={fieldLabelStyle}>
                  <span>Nombre</span>
                  <input
                    name="nombre"
                    required
                    placeholder="Tienda Smart"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Codigo</span>
                  <input
                    name="codigo"
                    required
                    placeholder="TIENDASMART"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    placeholder="smart@afiliados.test"
                    style={fieldStyle}
                  />
                </label>
                <label style={fieldLabelStyle}>
                  <span>Comision (%)</span>
                  <input
                    name="tasaComision"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    placeholder="10"
                    style={fieldStyle}
                  />
                </label>
              </div>
              <label style={{ ...fieldLabelStyle, maxWidth: 280 }}>
                <span>Estado</span>
                <select
                  name="estado"
                  defaultValue={String(ESTADO_AFILIADO.ACTIVO)}
                  style={fieldStyle}
                >
                  <option value={String(ESTADO_AFILIADO.INACTIVO)}>INACTIVO</option>
                  <option value={String(ESTADO_AFILIADO.ACTIVO)}>ACTIVO</option>
                  <option value={String(ESTADO_AFILIADO.SUSPENDIDO)}>SUSPENDIDO</option>
                </select>
              </label>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <p style={helperStyle}>
                  Usa codigos unicos por tienda para identificar trafico referido.
                </p>
                <button type="submit" style={primaryButtonStyle}>
                  Crear afiliado
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

      <s-section heading="Gestion de afiliados">
        {afiliados.length === 0 ? (
          <div style={surfaceStyle}>
            <s-paragraph>No hay afiliados registrados.</s-paragraph>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {afiliados.map((afiliado) => (
              <div key={afiliado.id} style={surfaceStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <s-heading>{afiliado.nombre}</s-heading>
                    <p style={helperStyle}>Creado: {new Date(afiliado.creadoEn).toLocaleDateString()}</p>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={pillStyle}>{afiliado.codigo}</span>
                    <span style={pillStyle}>{etiquetaEstadoAfiliado(afiliado.estado)}</span>
                    <span style={pillStyle}>{afiliado.tasaComision.toFixed(2)}%</span>
                  </div>
                </div>

                <Form method="post">
                  <input type="hidden" name="_action" value="editar_afiliado" />
                  <input type="hidden" name="afiliadoId" value={afiliado.id} />
                  <div style={formGridStyle}>
                    <div style={twoColumnGridStyle}>
                      <label style={fieldLabelStyle}>
                        <span>Nombre</span>
                        <input
                          name="nombre"
                          required
                          defaultValue={afiliado.nombre}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Codigo</span>
                        <input
                          name="codigo"
                          required
                          defaultValue={afiliado.codigo}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Email</span>
                        <input
                          name="email"
                          type="email"
                          defaultValue={afiliado.email || ""}
                          style={fieldStyle}
                        />
                      </label>
                      <label style={fieldLabelStyle}>
                        <span>Comision (%)</span>
                        <input
                          name="tasaComision"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          defaultValue={afiliado.tasaComision}
                          style={fieldStyle}
                        />
                      </label>
                    </div>
                    <label style={{ ...fieldLabelStyle, maxWidth: 280 }}>
                      <span>Estado</span>
                      <select
                        name="estado"
                        defaultValue={String(afiliado.estado)}
                        style={fieldStyle}
                      >
                        <option value={String(ESTADO_AFILIADO.INACTIVO)}>INACTIVO</option>
                        <option value={String(ESTADO_AFILIADO.ACTIVO)}>ACTIVO</option>
                        <option value={String(ESTADO_AFILIADO.SUSPENDIDO)}>SUSPENDIDO</option>
                      </select>
                    </label>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <p style={helperStyle}>{afiliado.email || "Sin email configurado"}</p>
                      <button type="submit" style={secondaryButtonStyle}>
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </Form>

                <Form method="post" style={{ marginTop: 12 }}>
                  <input type="hidden" name="_action" value="eliminar_afiliado" />
                  <input type="hidden" name="afiliadoId" value={afiliado.id} />
                  <button type="submit" style={dangerButtonStyle}>
                    Eliminar afiliado
                  </button>
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
