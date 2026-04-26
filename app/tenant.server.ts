import prisma from "./db.server";

export async function obtenerOCrearTienda(shop: string) {
  return prisma.tienda.upsert({
    where: { dominio: shop },
    update: {},
    create: { dominio: shop },
  });
}
