-- CreateTable
CREATE TABLE "ConfiguracionTienda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "parametroRef" TEXT NOT NULL DEFAULT 'ref',
    "diasVentanaAtribucion" INTEGER NOT NULL DEFAULT 30,
    "trackingActivo" BOOLEAN NOT NULL DEFAULT true,
    "requiereCampana" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "ConfiguracionTienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuscripcionApp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "nombrePlan" TEXT,
    "shopifySubscriptionId" TEXT,
    "shopifyLineItemId" TEXT,
    "cappedAmount" DECIMAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" INTEGER NOT NULL DEFAULT 0,
    "fechaActivacion" DATETIME,
    "fechaCancelacion" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "SuscripcionApp_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracionTienda_tiendaId_key" ON "ConfiguracionTienda"("tiendaId");

-- CreateIndex
CREATE UNIQUE INDEX "SuscripcionApp_shopifySubscriptionId_key" ON "SuscripcionApp"("shopifySubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SuscripcionApp_shopifyLineItemId_key" ON "SuscripcionApp"("shopifyLineItemId");

-- CreateIndex
CREATE INDEX "SuscripcionApp_tiendaId_estado_creadoEn_idx" ON "SuscripcionApp"("tiendaId", "estado", "creadoEn" DESC);
