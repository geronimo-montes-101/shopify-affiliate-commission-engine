import prisma from "../../db.server";

export type DashboardMetricas = {
  totalAfiliados: number;
  totalCampanas: number;
  totalVentasReferidas: number;
  totalComisionApp: number;
  totalComisionAfiliados: number;
  totalConversiones: number;
};

export async function obtenerDashboardMetricas(
  tiendaId: string,
): Promise<DashboardMetricas> {
  const [afiliados, campanas, resumenConversiones] = await Promise.all([
    prisma.afiliado.count({ where: { tiendaId } }),
    prisma.campana.count({ where: { tiendaId } }),
    prisma.eventoConversion.aggregate({
      where: { tiendaId },
      _sum: {
        totalOrden: true,
        montoComisionApp: true,
        montoComisionAfiliado: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    totalAfiliados: afiliados,
    totalCampanas: campanas,
    totalVentasReferidas: Number(resumenConversiones._sum.totalOrden ?? 0),
    totalComisionApp: Number(resumenConversiones._sum.montoComisionApp ?? 0),
    totalComisionAfiliados: Number(
      resumenConversiones._sum.montoComisionAfiliado ?? 0,
    ),
    totalConversiones: resumenConversiones._count.id,
  };
}
