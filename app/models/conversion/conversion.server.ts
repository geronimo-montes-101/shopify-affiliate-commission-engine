import prisma from "../db.server";
import {
  ENUM_ESTADO_CONVERSION,
  type ConversionCreateInput,
  type ConversionPayload,
  type ConversionResult,
} from "./conversion.types";
import { obtenerOCrearTienda } from "../../tenant.server";

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

export function validarPayloadConversion(
  payload: ConversionPayload,
): ConversionCreateInput | ConversionResult {
  const shopDomain = limpiarTexto(payload.shopDomain).toLowerCase();
  const affiliateCode = limpiarTexto(payload.affiliateCode).toUpperCase();
  const campaignCode = limpiarTexto(payload.campaignCode).toUpperCase() || null;
  const orderId = limpiarTexto(payload.orderId);
  const orderName = limpiarTexto(payload.orderName) || null;
  const totalAmount = parsearMonto(payload.totalAmount);
  const subtotalAmount = parsearMonto(payload.subtotalAmount ?? payload.totalAmount);
  const currency = limpiarTexto(payload.currency).toUpperCase() || "USD";
  const pixelEventId = limpiarTexto(payload.pixelEventId) || null;
  const occurredAtRaw = limpiarTexto(payload.occurredAt);
  const clientId = limpiarTexto(payload.clientId) || null;
  const sessionKey = limpiarTexto(payload.sessionKey) || null;
  const landingPath = limpiarTexto(payload.landingPath) || null;
  const refOriginal = limpiarTexto(payload.refOriginal) || null;

  if (!esDominioShopifyValido(shopDomain)) {
    return { ok: false, status: 400, mensaje: "shopDomain invalido." };
  }

  if (!affiliateCode || !orderId || totalAmount === null || subtotalAmount === null) {
    return {
      ok: false,
      status: 400,
      mensaje:
        "affiliateCode, orderId, totalAmount y subtotalAmount son obligatorios.",
    };
  }

  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, status: 400, mensaje: "occurredAt invalido." };
  }

  return {
    shopDomain,
    affiliateCode,
    campaignCode,
    orderId,
    orderName,
    totalAmount,
    subtotalAmount,
    currency,
    pixelEventId,
    occurredAt,
    clientId,
    sessionKey,
    landingPath,
    refOriginal,
  };
}

export async function registrarConversion(
  input: ConversionCreateInput,
): Promise<ConversionResult> {
  try {
    const tienda = await obtenerOCrearTienda(input.shopDomain);
    const afiliado = await prisma.afiliado.findUnique({
      where: {
        tiendaId_codigo: {
          tiendaId: tienda.id,
          codigo: input.affiliateCode,
        },
      },
    });

    if (!afiliado) {
      return { ok: false, status: 404, mensaje: "Afiliado no encontrado." };
    }

    const existente = await prisma.eventoConversion.findUnique({
      where: {
        tiendaId_ordenId: {
          tiendaId: tienda.id,
          ordenId: input.orderId,
        },
      },
    });

    if (existente) {
      return {
        ok: true,
        status: 200,
        duplicado: true,
        mensaje: "Conversion ya registrada previamente.",
        conversionId: existente.id,
      };
    }

    const campana = input.campaignCode
      ? await prisma.campana.findUnique({
        where: {
          tiendaId_codigo: {
            tiendaId: tienda.id,
            codigo: input.campaignCode,
          },
        },
      })
      : null;

    const montoComisionApp = (
      Number.parseFloat(input.totalAmount) * 0.05
    ).toFixed(2);
    const montoComisionAfiliado = (
      Number.parseFloat(input.totalAmount) * Number(afiliado.tasaComision)
    ).toFixed(2);

    const visitaReferida = await prisma.visitaReferida.create({
      data: {
        tiendaId: tienda.id,
        afiliadoId: afiliado.id,
        campanaId: campana?.id,
        codigoRefOriginal: input.refOriginal ?? input.affiliateCode,
        claveSesion: input.sessionKey,
        rutaEntrada: input.landingPath,
        tokenCliente: input.clientId,
        primerContactoEn: input.occurredAt,
      },
    });

    const conversion = await prisma.eventoConversion.create({
      data: {
        tiendaId: tienda.id,
        afiliadoId: afiliado.id,
        campanaId: campana?.id,
        visitaReferidaId: visitaReferida.id,
        ordenId: input.orderId,
        ordenNombre: input.orderName,
        subtotalOrden: input.subtotalAmount,
        totalOrden: input.totalAmount,
        moneda: input.currency,
        montoComisionAfiliado,
        montoComisionApp,
        pixelEventoId: input.pixelEventId,
        estado: ENUM_ESTADO_CONVERSION.PENDIENTE,
        ocurridoEn: input.occurredAt,
      },
    });

    return {
      ok: true,
      status: 200,
      duplicado: false,
      mensaje: "Conversion registrada.",
      conversionId: conversion.id,
      montoComisionApp,
      montoComisionAfiliado,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return {
        ok: true,
        status: 200,
        duplicado: true,
        mensaje: "Conversion duplicada detectada por idempotencia.",
      };
    }

    return {
      ok: false,
      status: 500,
      mensaje: "No se pudo registrar la conversion.",
    };
  }
}
