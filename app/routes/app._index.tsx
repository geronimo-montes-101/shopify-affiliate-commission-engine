import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { obtenerOCrearTienda } from "../tenant.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const tienda = await obtenerOCrearTienda(session.shop);

  const [afiliados, campanas, resumenConversiones] = await Promise.all([
    prisma.afiliado.count({ where: { tiendaId: tienda.id } }),
    prisma.campana.count({ where: { tiendaId: tienda.id } }),
    prisma.eventoConversion.aggregate({
      where: { tiendaId: tienda.id },
      _sum: {
        totalOrden: true,
        montoComisionApp: true,
        montoComisionAfiliado: true,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  return {
    metricas: {
      totalAfiliados: afiliados,
      totalCampanas: campanas,
      totalVentasReferidas: Number(resumenConversiones._sum.totalOrden ?? 0),
      totalComisionApp: Number(resumenConversiones._sum.montoComisionApp ?? 0),
      totalComisionAfiliados: Number(resumenConversiones._sum.montoComisionAfiliado ?? 0),
      totalConversiones: resumenConversiones._count.id,
    },
  };
};

export default function Index() {
  const { metricas } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Affiliate & Commission Engine">
      <s-section heading="Dashboard">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
            <s-heading>Ventas referidas</s-heading>
            <s-paragraph>${metricas.totalVentasReferidas.toFixed(2)}</s-paragraph>
            <s-paragraph>{metricas.totalConversiones} conversiones</s-paragraph>
          </div>
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
            <s-heading>Comision app</s-heading>
            <s-paragraph>${metricas.totalComisionApp.toFixed(2)}</s-paragraph>
          </div>
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
            <s-heading>Comision afiliados</s-heading>
            <s-paragraph>${metricas.totalComisionAfiliados.toFixed(2)}</s-paragraph>
          </div>
          <div style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 12 }}>
            <s-heading>Base comercial</s-heading>
            <s-paragraph>{metricas.totalAfiliados} afiliados</s-paragraph>
            <s-paragraph>{metricas.totalCampanas} campanas</s-paragraph>
          </div>
        </div>
      </s-section>

      <s-section heading="Estado del MVP">
        <s-paragraph>
          Ya tenemos autenticacion embedded, sesiones Shopify, campanas y
          panel base para afiliados y metricas.
        </s-paragraph>
      </s-section>

      <s-section heading="Siguientes modulos">
        <s-unordered-list>
          <s-list-item>Captura de `ref` y persistencia client-side.</s-list-item>
          <s-list-item>Web Pixel con evento `checkout_completed`.</s-list-item>
          <s-list-item>Endpoint backend con idempotencia.</s-list-item>
          <s-list-item>UsageRecord con regla del 5%.</s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section heading="Accesos rapidos">
        <s-unordered-list>
          <s-list-item>
            <Link to="/app/afiliados">Gestion de afiliados</Link>
          </s-list-item>
          <s-list-item>
            <Link to="/app/campanas">Gestion de campanas</Link>
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Estado actual">
        <s-paragraph>
          Mantiene autenticacion embedded, sesiones de Shopify y stack
          requerido para la prueba.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Pendientes criticos">
        <s-unordered-list>
          <s-list-item>Captura de `ref` y persistencia client-side.</s-list-item>
          <s-list-item>Web Pixel con evento `checkout_completed`.</s-list-item>
          <s-list-item>Backend de conversiones con idempotencia.</s-list-item>
          <s-list-item>UsageRecord con regla del 5%.</s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Documentacion clave">
        <s-unordered-list>
          <s-list-item>
            <a
              href="https://shopify.dev/docs/apps/build/marketing-analytics/build-web-pixels"
              target="_blank"
              rel="noreferrer"
            >
              Web Pixel API
            </a>
          </s-list-item>
          <s-list-item>
            <a
              href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/appUsageRecordCreate"
              target="_blank"
              rel="noreferrer"
            >
              appUsageRecordCreate
            </a>
          </s-list-item>
          <s-list-item>
            <a
              href="https://shopify.dev/docs/apps/launch/billing/subscription-billing"
              target="_blank"
              rel="noreferrer"
            >
              Billing subscription y capped amount
            </a>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
