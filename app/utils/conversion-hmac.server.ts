import { createHmac, timingSafeEqual } from "node:crypto";

export function obtenerSecretoConversionHmac(): string | null {
  const s = process.env.CONVERSION_HMAC_SECRET?.trim();
  return s ? s : null;
}

export function firmarCuerpoConversion(
  timestampSec: string,
  rawBody: string,
  secreto: string,
): string {
  return createHmac("sha256", secreto)
    .update(`${timestampSec}.${rawBody}`, "utf8")
    .digest("hex");
}

/**
 * Si CONVERSION_HMAC_SECRET no esta definido, no se exige firma (desarrollo).
 * Si esta definido, exige cabeceras X-CAE-Timestamp y X-CAE-Signature validas.
 */
export function esFirmaConversionValida(
  timestampSec: string | null,
  firmaHex: string | null,
  rawBody: string,
): boolean {
  const secreto = obtenerSecretoConversionHmac();
  if (!secreto) return true;

  const ts = (timestampSec ?? "").trim();
  const sig = (firmaHex ?? "").trim().toLowerCase();
  if (!ts || !sig) return false;

  const parsed = Number.parseInt(ts, 10);
  if (Number.isNaN(parsed)) return false;
  const ahora = Math.floor(Date.now() / 1000);
  if (Math.abs(ahora - parsed) > 300) return false;

  const esperado = firmarCuerpoConversion(ts, rawBody, secreto);
  try {
    const a = Buffer.from(esperado, "hex");
    const b = Buffer.from(sig, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
