import type {
  HeadersFunction,
} from "react-router";
import type { CSSProperties } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

const surfaceStyle: CSSProperties = {
  border: "1px solid #d9d9d9",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
};

export default function AppCampanasRoute() {
  const location = useLocation();
  const tabs = [
    { href: "/app/campanas", label: "Listado" },
    { href: "/app/campanas/nuevo", label: "Nueva campana" },
  ];

  return (
    <s-page heading="Campanas">
      <s-section heading="Administracion">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {tabs.map((tab) => {
            const isActive =
              location.pathname === tab.href ||
              (tab.href === "/app/campanas" && location.pathname === "/app/campanas/");

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
        <div style={surfaceStyle}>
          <Outlet />
        </div>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
