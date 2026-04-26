import type { CSSProperties } from "react";
import type { HeadersFunction } from "react-router";
import { Link, Outlet, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

export default function AppAfiliadosRoute() {
  const location = useLocation();
  const tabs = [
    { href: "/app/afiliados", label: "Listado" },
    { href: "/app/afiliados/nuevo", label: "Nuevo afiliado" },
  ];

  return (
    <s-page heading="Afiliados">
      <s-section heading="Administracion">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.href ||
              (tab.href === "/app/afiliados" && location.pathname === "/app/afiliados/");

            return (
              <Link
                key={tab.href}
                to={tab.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 36,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #c9cccf",
                  background: isActive ? "#1f1f1f" : "#ffffff",
                  color: isActive ? "#ffffff" : "#1f1f1f",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <Outlet />
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
