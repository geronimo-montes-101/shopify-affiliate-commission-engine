import { PrismaClient } from "@prisma/client";

declare global {
	// Evita múltiples instancias en dev (HMR)
	// eslint-disable-next-line no-var
	var __db__: PrismaClient | undefined;
}

const prisma = globalThis.__db__ ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
	globalThis.__db__ = prisma;
}

export default prisma;
