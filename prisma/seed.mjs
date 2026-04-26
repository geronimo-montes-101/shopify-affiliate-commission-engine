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

	console.log("Seed Prisma 6 completado");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
