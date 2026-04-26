import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <s-page heading="Affiliate & Commission Engine">
      <s-section heading="Base limpia">
        <s-paragraph>
          Repositorio simplificado para construir el MVP de afiliados con
          tracking y comisiones.
        </s-paragraph>
      </s-section>
      <s-section heading="Siguientes módulos">
        <s-unordered-list>
          <s-list-item>Dashboard de metricas.</s-list-item>
          <s-list-item>CRUD de afiliados y porcentaje de comision.</s-list-item>
          <s-list-item>Captura de `ref` y persistencia client-side.</s-list-item>
          <s-list-item>Web Pixel con evento `checkout_completed`.</s-list-item>
          <s-list-item>UsageRecord con regla del 5%.</s-list-item>
        </s-unordered-list>
      </s-section>
      <s-section slot="aside" heading="Estado actual">
        <s-paragraph>
          Mantiene autenticacion embedded, sesiones de Shopify y stack requerido
          para la prueba.
        </s-paragraph>
      </s-section>
      <s-section slot="aside" heading="Documentacion clave">
        <s-unordered-list>
          <s-list-item>
            <s-link
              href="https://shopify.dev/docs/apps/build/marketing-analytics/build-web-pixels"
              target="_blank"
            >
              Web Pixel API
            </s-link>
          </s-list-item>
          <s-list-item>
            <s-link
              href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/appUsageRecordCreate"
              target="_blank"
            >
              appUsageRecordCreate
            </s-link>
          </s-list-item>
          <s-list-item>
            <s-link
              href="https://shopify.dev/docs/apps/launch/billing/subscription-billing"
              target="_blank"
            >
              Billing subscription y capped amount
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
