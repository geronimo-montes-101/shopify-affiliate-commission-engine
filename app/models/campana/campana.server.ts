import prisma from "../db.server";
import {
	ENUM_ESTADO_CAMPANA,
	type AfiliadoOptionModel,
	type CampanaCreateDto,
	type CampanaDetalleModel,
	type CampanaListItemModel,
	type CampanaUpdateDto,
} from "./campana.types";

type ValidacionCampanaError = { ok: false; mensaje: string };
type ValidacionCampanaCreateOk = { ok: true; data: CampanaCreateDto };
type ValidacionCampanaUpdateOk = { ok: true; data: CampanaUpdateDto };

export type ValidacionCampanaCreateResult =
	| ValidacionCampanaError
	| ValidacionCampanaCreateOk;
export type ValidacionCampanaUpdateResult =
	| ValidacionCampanaError
	| ValidacionCampanaUpdateOk;

export { ENUM_ESTADO_CAMPANA };

function codigoValido(codigo: string) {
	return /^[A-Z0-9\-_]+$/.test(codigo);
}

function fechaInvalida(fecha: string) {
	const date = new Date(fecha);
	return Number.isNaN(date.getTime());
}

export function validarCampanaCreateDesdeFormData(
	formData: FormData,
): ValidacionCampanaCreateResult {
	const nombre = String(formData.get("nombre") || "").trim();
	const codigo = String(formData.get("codigo") || "").trim().toUpperCase();
	const descripcion = String(formData.get("descripcion") || "").trim() || null;
	const fechaInicioRaw = String(formData.get("fechaInicio") || "");
	const fechaFinRaw = String(formData.get("fechaFin") || "");

	if (!nombre || nombre.length < 3) {
		return {
			ok: false,
			mensaje: "El nombre debe tener al menos 3 caracteres.",
		};
	}

	if (!codigo || !codigoValido(codigo)) {
		return {
			ok: false,
			mensaje: "El codigo solo acepta A-Z, 0-9, guion y guion bajo.",
		};
	}

	if (!fechaInicioRaw || fechaInvalida(fechaInicioRaw)) {
		return { ok: false, mensaje: "La fecha de inicio es obligatoria." };
	}

	if (fechaFinRaw && (fechaInvalida(fechaFinRaw) || new Date(fechaFinRaw) < new Date(fechaInicioRaw))) {
		return {
			ok: false,
			mensaje: "La fecha de fin no puede ser anterior al inicio.",
		};
	}

	return {
		ok: true,
		data: {
			nombre,
			codigo,
			descripcion,
			fechaInicio: new Date(fechaInicioRaw),
			fechaFin: fechaFinRaw ? new Date(fechaFinRaw) : null,
			estado: ENUM_ESTADO_CAMPANA.ACTIVA,
		},
	};
}

export function validarCampanaUpdateDesdeFormData(
	formData: FormData,
): ValidacionCampanaUpdateResult {
	const nombre = String(formData.get("nombre") || "").trim();
	const descripcion = String(formData.get("descripcion") || "").trim() || null;
	const fechaInicioRaw = String(formData.get("fechaInicio") || "");
	const fechaFinRaw = String(formData.get("fechaFin") || "");
	const estado = Number.parseInt(String(formData.get("estado") || "1"), 10);

	if (!nombre || !fechaInicioRaw || !Number.isInteger(estado) || fechaInvalida(fechaInicioRaw)) {
		return {
			ok: false,
			mensaje: "Completa correctamente los datos de la campana.",
		};
	}

	if (fechaFinRaw && (fechaInvalida(fechaFinRaw) || new Date(fechaFinRaw) < new Date(fechaInicioRaw))) {
		return {
			ok: false,
			mensaje: "La fecha de fin debe ser posterior al inicio.",
		};
	}

	return {
		ok: true,
		data: {
			nombre,
			descripcion,
			fechaInicio: new Date(fechaInicioRaw),
			fechaFin: fechaFinRaw ? new Date(fechaFinRaw) : null,
			estado,
		},
	};
}

export async function crearCampana(tiendaId: string, payload: CampanaCreateDto) {
	return prisma.campana.create({
		data: {
			tiendaId,
			...payload,
		},
	});
}

export async function actualizarCampana(
	campanaId: string,
	tiendaId: string,
	payload: CampanaUpdateDto,
) {
	return prisma.campana.updateMany({
		where: { id: campanaId, tiendaId },
		data: payload,
	});
}

export async function eliminarCampana(campanaId: string, tiendaId: string) {
	return prisma.campana.deleteMany({
		where: { id: campanaId, tiendaId },
	});
}

export async function listarCampanasListModel(
	tiendaId: string,
	estado?: number,
): Promise<CampanaListItemModel[]> {
	const campanas = await prisma.campana.findMany({
		where: {
			tiendaId,
			...(Number.isInteger(estado) ? { estado } : {}),
		},
		include: {
			_count: {
				select: { afiliados: true },
			},
		},
		orderBy: { fechaInicio: "desc" },
	});

	return campanas.map((campana) => ({
		id: campana.id,
		nombre: campana.nombre,
		codigo: campana.codigo,
		estado: campana.estado,
		fechaInicio: campana.fechaInicio.toISOString(),
		fechaFin: campana.fechaFin ? campana.fechaFin.toISOString() : null,
		afiliadosCount: campana._count.afiliados,
	}));
}

export async function obtenerCampanaDetalleModel(
	campanaId: string,
	tiendaId: string,
): Promise<CampanaDetalleModel | null> {
	const campana = await prisma.campana.findFirst({
		where: { id: campanaId, tiendaId },
		include: { afiliados: { include: { afiliado: true } } },
	});

	if (!campana) return null;

	return {
		id: campana.id,
		nombre: campana.nombre,
		codigo: campana.codigo,
		descripcion: campana.descripcion,
		estado: campana.estado,
		fechaInicio: campana.fechaInicio.toISOString().slice(0, 10),
		fechaFin: campana.fechaFin ? campana.fechaFin.toISOString().slice(0, 10) : "",
		afiliados: campana.afiliados.map((item) => ({
			id: item.id,
			afiliadoId: item.afiliadoId,
			codigo: item.afiliado.codigo,
			nombre: item.afiliado.nombre,
		})),
	};
}

export async function listarAfiliadosOptionModel(
	tiendaId: string,
): Promise<AfiliadoOptionModel[]> {
	const afiliados = await prisma.afiliado.findMany({
		where: { tiendaId },
		orderBy: { nombre: "asc" },
	});

	return afiliados.map((afiliado) => ({
		id: afiliado.id,
		codigo: afiliado.codigo,
		nombre: afiliado.nombre,
	}));
}

export async function asignarAfiliadoACampana(
	campanaId: string,
	afiliadoId: string,
) {
	return prisma.campanaAfiliado.upsert({
		where: { campanaId_afiliadoId: { campanaId, afiliadoId } },
		update: {},
		create: { campanaId, afiliadoId },
	});
}

export async function desasignarAfiliadoDeCampana(
	campanaId: string,
	afiliadoId: string,
) {
	return prisma.campanaAfiliado.deleteMany({
		where: { campanaId, afiliadoId },
	});
}
