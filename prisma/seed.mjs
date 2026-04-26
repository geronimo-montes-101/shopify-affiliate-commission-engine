import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tienda = await prisma.tienda.upsert({
    where: { dominio: "demo-store.myshopify.com" },
    update: {},
    create: { dominio: "demo-store.myshopify.com" },
  });

  const afiliados = [
    {
      codigo: "TIENDASMART",
      nombre: "Tienda Smart",
      email: "smart@afiliados.test",
      tasaComision: "0.10",
      estado: 1,
    },
    {
      codigo: "INFLUENCERPRO",
      nombre: "Influencer Pro",
      email: "influencer@afiliados.test",
      tasaComision: "0.15",
      estado: 1,
    },
    {
      codigo: "BLOGGERVIP",
      nombre: "Blogger VIP",
      email: "blogger@afiliados.test",
      tasaComision: "0.08",
      estado: 0,
    },
  ];

  for (const afiliado of afiliados) {
    await prisma.afiliado.upsert({
      where: {
        tiendaId_codigo: {
          tiendaId: tienda.id,
          codigo: afiliado.codigo,
        },
      },
      update: afiliado,
      create: { tiendaId: tienda.id, ...afiliado },
    });
  }

  const campana = await prisma.campana.upsert({
    where: {
      tiendaId_codigo: {
        tiendaId: tienda.id,
        codigo: "BLACKFRIDAY-2026",
      },
    },
    update: {
      nombre: "Black Friday 2026",
      descripcion: "Campana estacional de alta conversion",
      estado: 1,
    },
    create: {
      tiendaId: tienda.id,
      nombre: "Black Friday 2026",
      codigo: "BLACKFRIDAY-2026",
      descripcion: "Campana estacional de alta conversion",
      fechaInicio: new Date("2026-11-20T00:00:00.000Z"),
      fechaFin: new Date("2026-11-30T23:59:59.000Z"),
      estado: 1,
    },
  });

  const afiliadosActivos = await prisma.afiliado.findMany({
    where: { tiendaId: tienda.id, estado: 1 },
  });

  for (const afiliado of afiliadosActivos) {
    await prisma.campanaAfiliado.upsert({
      where: {
        campanaId_afiliadoId: {
          campanaId: campana.id,
          afiliadoId: afiliado.id,
        },
      },
      update: {},
      create: {
        campanaId: campana.id,
        afiliadoId: afiliado.id,
      },
    });
  }

  console.log("Seed Prisma 6 completado");
  console.log(`Campana creada/actualizada: ${campana.codigo}`);
  console.log(`Afiliados activos vinculados: ${afiliadosActivos.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
