import prisma from "../db.server";
import shopify from "../../shopify.server";
import { obtenerSuscripcionActivaTienda } from "../tienda/tienda.server";

export const ENUM_ESTADO_BITACORA_COBRO = {
  PENDIENTE: 1,
  EXITOSO: 2,
  ERROR: 3,
} as const;

const MUTATION = `#graphql
  mutation AppUsageRecordCreate(
    $subscriptionLineItemId: ID!
    $description: String!
    $price: MoneyInput!
  ) {
    appUsageRecordCreate(
      subscriptionLineItemId: $subscriptionLineItemId
      description: $description
      price: $price
    ) {
      userErrors {
        field
        message
      }
      appUsageRecord {
        id
      }
    }
  }
`;

function truncarMensaje(m: string, max = 2000) {
  return m.length <= max ? m : m.slice(0, max);
}

/**
 * Tras una conversion persistida, intenta crear UsageRecord en Shopify y deja evidencia en BitacoraCobroUso.
 * No relanza errores: la conversion ya es valida sin billing.
 */
export async function intentarRegistrarUsageRecordShopify(params: {
  tiendaId: string;
  shopDomain: string;
  eventoConversionId: string;
  ordenId: string;
  montoComisionApp: string;
  moneda: string;
}): Promise<void> {
  const suscripcion = await obtenerSuscripcionActivaTienda(params.tiendaId);
  const lineItemId = suscripcion?.shopifyLineItemId?.trim();
  if (!lineItemId) {
    return;
  }

  const bitacora = await prisma.bitacoraCobroUso.create({
    data: {
      tiendaId: params.tiendaId,
      eventoConversionId: params.eventoConversionId,
      suscripcionLineItemId: lineItemId,
      monto: params.montoComisionApp,
      moneda: params.moneda.toUpperCase(),
      estado: ENUM_ESTADO_BITACORA_COBRO.PENDIENTE,
      intentos: 1,
    },
  });

  try {
    const { admin } = await shopify.unauthenticated.admin(params.shopDomain);
    const response = await admin.graphql(MUTATION, {
      variables: {
        subscriptionLineItemId: lineItemId,
        description: truncarMensaje(
          `Tarifa app 5% — pedido ${params.ordenId}`,
          500,
        ),
        price: {
          amount: params.montoComisionApp,
          currencyCode: params.moneda.toUpperCase(),
        },
      },
    });

    const json = (await response.json()) as {
      data?: {
        appUsageRecordCreate?: {
          userErrors?: { field?: string[]; message: string }[];
          appUsageRecord?: { id: string } | null;
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      const msg = json.errors.map((e) => e.message).join("; ");
      await prisma.bitacoraCobroUso.update({
        where: { id: bitacora.id },
        data: {
          estado: ENUM_ESTADO_BITACORA_COBRO.ERROR,
          codigoError: "GRAPHQL_TOP_LEVEL",
          mensajeError: truncarMensaje(msg),
        },
      });
      return;
    }

    const payload = json.data?.appUsageRecordCreate;
    const userErrors = payload?.userErrors ?? [];
    if (userErrors.length > 0) {
      const msg = userErrors.map((e) => e.message).join("; ");
      await prisma.bitacoraCobroUso.update({
        where: { id: bitacora.id },
        data: {
          estado: ENUM_ESTADO_BITACORA_COBRO.ERROR,
          codigoError: "APP_USAGE_USER_ERRORS",
          mensajeError: truncarMensaje(msg),
        },
      });
      return;
    }

    const usageId = payload?.appUsageRecord?.id ?? null;
    if (!usageId) {
      await prisma.bitacoraCobroUso.update({
        where: { id: bitacora.id },
        data: {
          estado: ENUM_ESTADO_BITACORA_COBRO.ERROR,
          codigoError: "MISSING_USAGE_RECORD_ID",
          mensajeError: "Respuesta sin appUsageRecord.id.",
        },
      });
      return;
    }

    await prisma.bitacoraCobroUso.update({
      where: { id: bitacora.id },
      data: {
        estado: ENUM_ESTADO_BITACORA_COBRO.EXITOSO,
        usageRecordId: usageId,
        cobradoEn: new Date(),
      },
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido.";
    await prisma.bitacoraCobroUso.update({
      where: { id: bitacora.id },
      data: {
        estado: ENUM_ESTADO_BITACORA_COBRO.ERROR,
        codigoError: "EXCEPTION",
        mensajeError: truncarMensaje(mensaje),
      },
    });
  }
}
