import { Afiliado } from "@prisma/client";
import prisma from "../db.server";
import {
	ENUM_ESTADO_AFILIADO,
	type AfiliadoCardModel,
	type AfiliadoCreateDto,
	type AfiliadoDetailModel,
	type AfiliadoListItemModel,
	type AfiliadoUpdateDto,
} from "./afiliado.types";

type AfiliadoPayload = AfiliadoCreateDto;

type ValidacionAfiliadoError = {
	ok: false;
	mensaje: string;
};

type ValidacionAfiliadoOk = {
	ok: true;
	data: AfiliadoPayload;
};

export type ValidacionAfiliadoResult =
	| ValidacionAfiliadoError
	| ValidacionAfiliadoOk;

function normalizarCodigo(valor: FormDataEntryValue | null) {
	return String(valor || "")
		.trim()
		.toUpperCase()
		.replace(/\s+/g, "-");
}

function parsearTasaComision(valor: FormDataEntryValue | null) {
	const porcentaje = Number.parseFloat(String(valor || ""));
	if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
		return null;
	}
	return (porcentaje / 100).toFixed(4);
}

function emailValido(email: string | null) {
	if (!email) return true;
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarAfiliadoDesdeFormData(
	formData: FormData,
	options?: { validarNombreMinimo?: boolean; validarCodigoMinimo?: boolean },
): ValidacionAfiliadoResult {
	const nombre = String(formData.get("nombre") || "").trim();
	const codigo = normalizarCodigo(formData.get("codigo"));
	const email = String(formData.get("email") || "").trim() || null;
	const tasaComision = parsearTasaComision(formData.get("tasaComision"));
	const estado = Number.parseInt(
		String(formData.get("estado") || ENUM_ESTADO_AFILIADO.ACTIVO),
		10,
	);

	if ((options?.validarNombreMinimo ?? true) && nombre.length < 3) {
		return { ok: false, mensaje: "El nombre debe tener al menos 3 caracteres." };
	}

	if ((options?.validarCodigoMinimo ?? true) && codigo.length < 3) {
		return { ok: false, mensaje: "El codigo debe tener al menos 3 caracteres." };
	}

	if (!emailValido(email)) {
		return { ok: false, mensaje: "El email no tiene un formato valido." };
	}

	if (tasaComision === null || !Number.isInteger(estado)) {
		return {
			ok: false,
			mensaje: "Completa un porcentaje valido (0-100) y estado.",
		};
	}

	return {
		ok: true,
		data: { nombre, codigo, email, tasaComision, estado },
	};
}

export async function crearAfiliado(
	tiendaId: string,
	payload: AfiliadoCreateDto,
) {
	return prisma.afiliado.create({
		data: {
			tiendaId,
			...payload,
		},
	});
}

export async function actualizarAfiliado(
	afiliadoId: string,
	tiendaId: string,
	payload: AfiliadoUpdateDto,
) {
	return prisma.afiliado.updateMany({
		where: { id: afiliadoId, tiendaId },
		data: payload,
	});
}

export async function obtenerAfiliadoPorId(afiliadoId: string, tiendaId: string) {
	return prisma.afiliado.findFirst({
		where: { id: afiliadoId, tiendaId },
	});
}

export async function listarAfiliados(tiendaId: string) {
	return prisma.afiliado.findMany({
		where: { tiendaId },
		orderBy: { creadoEn: "desc" },
	});
}

export async function listarAfiliadosListModel(
	tiendaId: string,
): Promise<AfiliadoListItemModel[]> {
	const afiliados = await listarAfiliados(tiendaId);
	return afiliados.map((afiliado: Afiliado) => ({
		id: afiliado.id,
		nombre: afiliado.nombre,
		codigo: afiliado.codigo,
		email: afiliado.email,
		estado: afiliado.estado,
		tasaComision: Number(afiliado.tasaComision) * 100,
		creadoEn: afiliado.creadoEn.toISOString(),
	}));
}

export function toAfiliadoCardModel(
	item: AfiliadoListItemModel,
): AfiliadoCardModel {
	return {
		id: item.id,
		nombre: item.nombre,
		codigo: item.codigo,
		email: item.email,
		estado: item.estado,
		tasaComision: item.tasaComision,
	};
}

export function toAfiliadoDetailModel(afiliado: {
	id: string;
	nombre: string;
	codigo: string;
	email: string | null;
	estado: number;
	tasaComision: unknown;
}): AfiliadoDetailModel {
	return {
		id: afiliado.id,
		nombre: afiliado.nombre,
		codigo: afiliado.codigo,
		email: afiliado.email,
		estado: afiliado.estado,
		tasaComision: Number(afiliado.tasaComision) * 100,
	};
}

export async function eliminarAfiliado(afiliadoId: string, tiendaId: string) {
	return prisma.afiliado.deleteMany({
		where: { id: afiliadoId, tiendaId },
	});
}
