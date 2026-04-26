export const ENUM_ESTADO_CONVERSION = {
  PENDIENTE: 1,
  PROCESADA: 2,
  DESCARTADA: 3,
  ERROR: 4,
} as const;

export type ConversionPayload = {
  shopDomain?: unknown;
  affiliateCode?: unknown;
  campaignCode?: unknown;
  orderId?: unknown;
  orderName?: unknown;
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

export type ConversionCreateInput = {
  shopDomain: string;
  affiliateCode: string;
  campaignCode: string | null;
  orderId: string;
  orderName: string | null;
  totalAmount: string;
  subtotalAmount: string;
  currency: string;
  pixelEventId: string | null;
  occurredAt: Date;
  clientId: string | null;
  sessionKey: string | null;
  landingPath: string | null;
  refOriginal: string | null;
};

export type ConversionResult =
  | {
      ok: false;
      status: number;
      mensaje: string;
    }
  | {
      ok: true;
      status: number;
      duplicado: boolean;
      mensaje: string;
      conversionId?: string;
      montoComisionApp?: string;
      montoComisionAfiliado?: string;
    };
