-- CreateTable
CREATE TABLE "Campana" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME,
    "estado" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Campana_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampanaAfiliado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campanaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampanaAfiliado_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "Campana" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampanaAfiliado_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "Afiliado" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventoConversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "campanaId" TEXT,
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
    CONSTRAINT "EventoConversion_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "Campana" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EventoConversion_visitaReferidaId_fkey" FOREIGN KEY ("visitaReferidaId") REFERENCES "VisitaReferida" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventoConversion" ("actualizadoEn", "afiliadoId", "creadoEn", "estado", "id", "moneda", "montoComisionAfiliado", "montoComisionApp", "ocurridoEn", "ordenId", "ordenNombre", "pixelEventoId", "subtotalOrden", "tiendaId", "totalOrden", "visitaReferidaId") SELECT "actualizadoEn", "afiliadoId", "creadoEn", "estado", "id", "moneda", "montoComisionAfiliado", "montoComisionApp", "ocurridoEn", "ordenId", "ordenNombre", "pixelEventoId", "subtotalOrden", "tiendaId", "totalOrden", "visitaReferidaId" FROM "EventoConversion";
DROP TABLE "EventoConversion";
ALTER TABLE "new_EventoConversion" RENAME TO "EventoConversion";
CREATE INDEX "EventoConversion_tiendaId_ocurridoEn_idx" ON "EventoConversion"("tiendaId", "ocurridoEn" DESC);
CREATE INDEX "EventoConversion_tiendaId_afiliadoId_ocurridoEn_idx" ON "EventoConversion"("tiendaId", "afiliadoId", "ocurridoEn" DESC);
CREATE INDEX "EventoConversion_tiendaId_campanaId_ocurridoEn_idx" ON "EventoConversion"("tiendaId", "campanaId", "ocurridoEn" DESC);
CREATE UNIQUE INDEX "EventoConversion_tiendaId_ordenId_key" ON "EventoConversion"("tiendaId", "ordenId");
CREATE UNIQUE INDEX "EventoConversion_tiendaId_pixelEventoId_key" ON "EventoConversion"("tiendaId", "pixelEventoId");
CREATE TABLE "new_VisitaReferida" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "afiliadoId" TEXT NOT NULL,
    "campanaId" TEXT,
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
    CONSTRAINT "VisitaReferida_afiliadoId_fkey" FOREIGN KEY ("afiliadoId") REFERENCES "Afiliado" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VisitaReferida_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "Campana" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_VisitaReferida" ("afiliadoId", "claveSesion", "codigoRefOriginal", "creadoEn", "id", "primerContactoEn", "rutaEntrada", "tiendaId", "tokenCliente", "utmCampaign", "utmMedium", "utmSource") SELECT "afiliadoId", "claveSesion", "codigoRefOriginal", "creadoEn", "id", "primerContactoEn", "rutaEntrada", "tiendaId", "tokenCliente", "utmCampaign", "utmMedium", "utmSource" FROM "VisitaReferida";
DROP TABLE "VisitaReferida";
ALTER TABLE "new_VisitaReferida" RENAME TO "VisitaReferida";
CREATE INDEX "VisitaReferida_tiendaId_afiliadoId_creadoEn_idx" ON "VisitaReferida"("tiendaId", "afiliadoId", "creadoEn" DESC);
CREATE INDEX "VisitaReferida_tiendaId_campanaId_creadoEn_idx" ON "VisitaReferida"("tiendaId", "campanaId", "creadoEn" DESC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Campana_tiendaId_estado_fechaInicio_idx" ON "Campana"("tiendaId", "estado", "fechaInicio" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Campana_tiendaId_codigo_key" ON "Campana"("tiendaId", "codigo");

-- CreateIndex
CREATE INDEX "CampanaAfiliado_afiliadoId_idx" ON "CampanaAfiliado"("afiliadoId");

-- CreateIndex
CREATE UNIQUE INDEX "CampanaAfiliado_campanaId_afiliadoId_key" ON "CampanaAfiliado"("campanaId", "afiliadoId");
