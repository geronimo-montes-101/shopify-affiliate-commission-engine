import prisma from "../db.server";
import {
  ENUM_ESTADO_SUSCRIPCION_APP,
  type ConfiguracionTiendaModel,
  type SuscripcionAppModel,
} from "./tienda.types";

export async function obtenerOCrearTienda(shop: string) {
  return prisma.tienda.upsert({
    where: { dominio: shop },
    update: {},
    create: { dominio: shop },
  });
}

export async function obtenerConfiguracionTienda(
  tiendaId: string,
): Promise<ConfiguracionTiendaModel> {
  const configuracion = await prisma.configuracionTienda.upsert({
    where: { tiendaId },
    update: {},
    create: { tiendaId },
  });

  return {
    id: configuracion.id,
    tiendaId: configuracion.tiendaId,
    parametroRef: configuracion.parametroRef,
    diasVentanaAtribucion: configuracion.diasVentanaAtribucion,
    trackingActivo: configuracion.trackingActivo,
    requiereCampana: configuracion.requiereCampana,
  };
}

export async function obtenerSuscripcionActivaTienda(
  tiendaId: string,
): Promise<SuscripcionAppModel | null> {
  const suscripcion = await prisma.suscripcionApp.findFirst({
    where: {
      tiendaId,
      estado: ENUM_ESTADO_SUSCRIPCION_APP.ACTIVA,
    },
    orderBy: { creadoEn: "desc" },
  });

  if (!suscripcion) return null;

  return {
    id: suscripcion.id,
    tiendaId: suscripcion.tiendaId,
    nombrePlan: suscripcion.nombrePlan,
    shopifySubscriptionId: suscripcion.shopifySubscriptionId,
    shopifyLineItemId: suscripcion.shopifyLineItemId,
    cappedAmount: Number(suscripcion.cappedAmount),
    moneda: suscripcion.moneda,
    estado: suscripcion.estado,
    fechaActivacion: suscripcion.fechaActivacion
      ? suscripcion.fechaActivacion.toISOString()
      : null,
    fechaCancelacion: suscripcion.fechaCancelacion
      ? suscripcion.fechaCancelacion.toISOString()
      : null,
  };
}
