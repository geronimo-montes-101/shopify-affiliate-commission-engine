export const ENUM_ESTADO_SUSCRIPCION_APP = {
  INACTIVA: 0,
  ACTIVA: 1,
  CANCELADA: 2,
  SUSPENDIDA: 3,
} as const;

export type ConfiguracionTiendaModel = {
  id: string;
  tiendaId: string;
  parametroRef: string;
  diasVentanaAtribucion: number;
  trackingActivo: boolean;
  requiereCampana: boolean;
};

export type SuscripcionAppModel = {
  id: string;
  tiendaId: string;
  nombrePlan: string | null;
  shopifySubscriptionId: string | null;
  shopifyLineItemId: string | null;
  cappedAmount: number;
  moneda: string;
  estado: number;
  fechaActivacion: string | null;
  fechaCancelacion: string | null;
};
