-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dominio" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Afiliado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "tasaComision" DECIMAL NOT NULL DEFAULT 0,
    "estado" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Afiliado_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VisitaReferida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "codigoRefOriginal" TEXT,
    "claveSesion" TEXT,
    "rutaEntrada" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "tokenCliente" TEXT,
    "primerContactoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitaReferida_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisitaReferida_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "Afiliado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "visitaReferidaId" TEXT,
    "ordenId" TEXT NOT NULL,
    "ordenNombre" TEXT,
    "subtotalOrden" DECIMAL NOT NULL DEFAULT 0,
    "totalOrden" DECIMAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "montoComisionAfiliado" DECIMAL NOT NULL DEFAULT 0,
    "montoComisionApp" DECIMAL NOT NULL DEFAULT 0,
    "pixelEventoId" TEXT,
    "estado" INTEGER NOT NULL DEFAULT 1,
    "ocurridoEn" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "EventoConversion_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoConversion_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "Afiliado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoConversion_visitaReferidaId_fkey" FOREIGN KEY ("visitaReferidaId") REFERENCES "VisitaReferida" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BitacoraCobroUso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "eventoConversionId" TEXT NOT NULL,
    "suscripcionLineItemId" TEXT,
    "usageRecordId" TEXT,
    "monto" DECIMAL NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" INTEGER NOT NULL DEFAULT 1,
    "codigoError" TEXT,
    "mensajeError" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "cobradoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "BitacoraCobroUso_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BitacoraCobroUso_eventoConversionId_fkey" FOREIGN KEY ("eventoConversionId") REFERENCES "EventoConversion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tienda_dominio_key" ON "Tienda"("dominio");

-- CreateIndex
CREATE INDEX "Afiliado_tiendaId_estado_idx" ON "Afiliado"("tiendaId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Afiliado_tiendaId_codigo_key" ON "Afiliado"("tiendaId", "codigo");

-- CreateIndex
CREATE INDEX "VisitaReferida_tiendaId_afiliadoId_creadoEn_idx" ON "VisitaReferida"("tiendaId", "afiliadoId", "creadoEn" DESC);

-- CreateIndex
CREATE INDEX "EventoConversion_tiendaId_ocurridoEn_idx" ON "EventoConversion"("tiendaId", "ocurridoEn" DESC);

-- CreateIndex
CREATE INDEX "EventoConversion_tiendaId_afiliadoId_ocurridoEn_idx" ON "EventoConversion"("tiendaId", "afiliadoId", "ocurridoEn" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EventoConversion_tiendaId_ordenId_key" ON "EventoConversion"("tiendaId", "ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoConversion_tiendaId_pixelEventoId_key" ON "EventoConversion"("tiendaId", "pixelEventoId");

-- CreateIndex
CREATE UNIQUE INDEX "BitacoraCobroUso_eventoConversionId_key" ON "BitacoraCobroUso"("eventoConversionId");

-- CreateIndex
CREATE UNIQUE INDEX "BitacoraCobroUso_usageRecordId_key" ON "BitacoraCobroUso"("usageRecordId");

-- CreateIndex
CREATE INDEX "BitacoraCobroUso_tiendaId_estado_creadoEn_idx" ON "BitacoraCobroUso"("tiendaId", "estado", "creadoEn" DESC);
