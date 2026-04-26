import type { ActionFunctionArgs } from "react-router";
import prisma from "../db.server";
import { obtenerOCrearTienda } from "../tenant.server";

const ESTADO_CONVERSION = {
	PENDIENTE: 1,
	PROCESADA: 2,
	DESCARTADA: 3,
	ERROR: 4,
} as const;

type ConversionPayload = {
	shopDomain?: unknown;
	affiliateCode?: unknown;
	orderId?: unknown;
	orderName?: unknown;
	campaignCode?: unknown;
	totalAmount?: unknown;
	subtotalAmount?: unknown;
	currency?: unknown;
	pixelEventId?: unknown;
	occurredAt?: unknown;
	clientId?: unknown;
	sessionKey?: unknown;
	landingPath?: unknown;
	refOriginal?: unknown;
};

function json(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers || {}),
		},
	});
}

function esDominioShopifyValido(shopDomain: string) {
	return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shopDomain);
}

function parsearMonto(valor: unknown) {
	const numero = Number.parseFloat(String(valor ?? ""));
	if (Number.isNaN(numero) || numero < 0) return null;
	return numero.toFixed(2);
}

function limpiarTexto(valor: unknown) {
	return String(valor ?? "").trim();
}

export const action = async ({ request }: ActionFunctionArgs) => {
	if (request.method.toUpperCase() !== "POST") {
		return json(
			{ ok: false, mensaje: "Metodo no permitido." },
			{ status: 405 },
		);
	}

	let payload: ConversionPayload;

	try {
		payload = (await request.json()) as ConversionPayload;
	} catch {
		return json({ ok: false, mensaje: "JSON invalido." }, { status: 400 });
	}

	const shopDomain = limpiarTexto(payload.shopDomain).toLowerCase();
	const affiliateCode = limpiarTexto(payload.affiliateCode).toUpperCase();
	const campaignCode = limpiarTexto(payload.campaignCode).toUpperCase() || null;
	const orderId = limpiarTexto(payload.orderId);
	const orderName = limpiarTexto(payload.orderName) || null;
	const totalAmount = parsearMonto(payload.totalAmount);
	const subtotalAmount = parsearMonto(
		payload.subtotalAmount ?? payload.totalAmount,
	);
	const currency = limpiarTexto(payload.currency).toUpperCase() || "USD";
	const pixelEventId = limpiarTexto(payload.pixelEventId) || null;
	const occurredAt = limpiarTexto(payload.occurredAt);
	const clientId = limpiarTexto(payload.clientId) || null;
	const sessionKey = limpiarTexto(payload.sessionKey) || null;
	const landingPath = limpiarTexto(payload.landingPath) || null;
	const refOriginal = limpiarTexto(payload.refOriginal) || null;

	if (!esDominioShopifyValido(shopDomain)) {
		return json(
			{ ok: false, mensaje: "shopDomain invalido." },
			{ status: 400 },
		);
	}

	if (
		!affiliateCode ||
		!orderId ||
		totalAmount === null ||
		subtotalAmount === null
	) {
		return json(
			{
				ok: false,
				mensaje:
					"affiliateCode, orderId, totalAmount y subtotalAmount son obligatorios.",
			},
			{ status: 400 },
		);
	}

	const fechaEvento = occurredAt ? new Date(occurredAt) : new Date();
	if (Number.isNaN(fechaEvento.getTime())) {
		return json(
			{ ok: false, mensaje: "occurredAt invalido." },
			{ status: 400 },
		);
	}

	try {
		const tienda = await obtenerOCrearTienda(shopDomain);
		const afiliado = await prisma.afiliado.findUnique({
			where: {
				tiendaId_codigo: {
					tiendaId: tienda.id,
					codigo: affiliateCode,
				},
			},
		});

		if (!afiliado) {
			return json(
				{ ok: false, mensaje: "Afiliado no encontrado." },
				{ status: 404 },
			);
		}

		const existente = await prisma.eventoConversion.findUnique({
			where: {
				tiendaId_ordenId: {
					tiendaId: tienda.id,
					ordenId: orderId,
				},
			},
		});

		if (existente) {
			return json(
				{
					ok: true,
					duplicado: true,
					mensaje: "Conversion ya registrada previamente.",
					conversionId: existente.id,
				},
				{ status: 200 },
			);
		}

		const campana = campaignCode
			? await prisma.campana.findUnique({
					where: {
						tiendaId_codigo: {
							tiendaId: tienda.id,
							codigo: campaignCode,
						},
					},
				})
			: null;

		const montoComisionApp = (Number.parseFloat(totalAmount) * 0.05).toFixed(2);
		const montoComisionAfiliado = (
			Number.parseFloat(totalAmount) * Number(afiliado.tasaComision)
		).toFixed(2);

		const visitaReferida = await prisma.visitaReferida.create({
			data: {
				tiendaId: tienda.id,
				afiliadoId: afiliado.id,
				campanaId: campana?.id,
				codigoRefOriginal: refOriginal ?? affiliateCode,
				claveSesion: sessionKey,
				rutaEntrada: landingPath,
				tokenCliente: clientId,
				primerContactoEn: fechaEvento,
			},
		});

		const conversion = await prisma.eventoConversion.create({
			data: {
				tiendaId: tienda.id,
				afiliadoId: afiliado.id,
				campanaId: campana?.id,
				visitaReferidaId: visitaReferida.id,
				ordenId: orderId,
				ordenNombre: orderName,
				subtotalOrden: subtotalAmount,
				totalOrden: totalAmount,
				moneda: currency,
				montoComisionAfiliado,
				montoComisionApp,
				pixelEventoId: pixelEventId,
				estado: ESTADO_CONVERSION.PENDIENTE,
				ocurridoEn: fechaEvento,
			},
		});

		return json({
			ok: true,
			duplicado: false,
			mensaje: "Conversion registrada.",
			conversionId: conversion.id,
			montoComisionApp,
			montoComisionAfiliado,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return json(
				{
					ok: true,
					duplicado: true,
					mensaje: "Conversion duplicada detectada por idempotencia.",
				},
				{ status: 200 },
			);
		}

		return json(
			{
				ok: false,
				mensaje: "No se pudo registrar la conversion.",
			},
			{ status: 500 },
		);
	}
};
