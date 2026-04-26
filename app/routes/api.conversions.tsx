import type { ActionFunctionArgs } from "react-router";
import {
  registrarConversion,
  validarPayloadConversion,
} from "../models/conversion/conversion.server";
import type { ConversionPayload } from "../models/conversion/conversion.types";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method.toUpperCase() !== "POST") {
    return json({ ok: false, mensaje: "Metodo no permitido." }, { status: 405 });
  }

  let payload: ConversionPayload;

  try {
    payload = (await request.json()) as ConversionPayload;
  } catch {
    return json({ ok: false, mensaje: "JSON invalido." }, { status: 400 });
  }

  const validacion = validarPayloadConversion(payload);
  if ("ok" in validacion) {
    return json(
      { ok: false, mensaje: validacion.mensaje },
      { status: validacion.status },
    );
  }

  const resultado = await registrarConversion(validacion);

  if (!resultado.ok) {
    return json(
      { ok: false, mensaje: resultado.mensaje },
      { status: resultado.status },
    );
  }

  return json(
    {
      ok: true,
      duplicado: resultado.duplicado,
      mensaje: resultado.mensaje,
      conversionId: resultado.conversionId,
      montoComisionApp: resultado.montoComisionApp,
      montoComisionAfiliado: resultado.montoComisionAfiliado,
    },
    { status: resultado.status },
  );
};
