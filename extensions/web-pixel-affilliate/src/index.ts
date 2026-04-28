import { register } from "@shopify/web-pixels-extension";

const STORAGE_KEY = "cae_affiliate_engine_v1";

type PixelSettings = {
  conversion_endpoint?: string;
};

type InitShop = {
  data?: {
    shop?: {
      myshopifyDomain?: string;
    };
  };
};

function parsePayload(raw: string | null | undefined): {
  affiliateCode: string;
  campaignCode: string;
  landingPath: string | null;
} | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const code = String(o.affiliateCode ?? "").trim().toUpperCase();
    if (!code) return null;
    return {
      affiliateCode: code,
      campaignCode: String(o.campaignCode ?? "").trim().toUpperCase(),
      landingPath: o.landingPath ? String(o.landingPath) : null,
    };
  } catch {
    return null;
  }
}

function persistRefFromHref(href: string, browser: BrowserLike): void {
  try {
    const u = new URL(href);
    const ref = (u.searchParams.get("ref") || "").trim();
    const camp = (u.searchParams.get("camp") || "").trim();
    if (!ref) return;
    const payload = JSON.stringify({
      affiliateCode: ref.toUpperCase(),
      campaignCode: camp ? camp.toUpperCase() : "",
      capturedAt: new Date().toISOString(),
      landingPath: u.pathname || "/",
      source: "web_pixel_page_viewed",
    });
    void browser.localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    /* noop */
  }
}

/** Subconjunto usado del API de browser del pixel (tipos locales para evitar dependencia de tipos internos). */
type BrowserLike = {
  localStorage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  };
};

register(({ analytics, browser, init, settings }) => {
  const shopDomain =
    (init as InitShop).data?.shop?.myshopifyDomain?.toLowerCase() ?? "";
  const endpoint = String(
    (settings as PixelSettings).conversion_endpoint ?? "",
  ).trim();

  analytics.subscribe("page_viewed", (event) => {
    const href = event.context?.document?.location?.href;
    if (href) persistRefFromHref(href, browser);
  });

  analytics.subscribe("checkout_completed", async (event) => {
    if (!endpoint || !shopDomain) return;

    let rawStored: string | null = null;
    try {
      rawStored = await browser.localStorage.getItem(STORAGE_KEY);
    } catch {
      rawStored = null;
    }

    const stored = parsePayload(rawStored);
    if (!stored) return;

    const checkout = event.data.checkout;
    const order = checkout.order;
    const orderId = order?.id ?? checkout.token ?? null;
    if (!orderId) return;

    const total = checkout.totalPrice;
    const subtotal = checkout.subtotalPrice ?? checkout.totalPrice;
    const currency =
      total?.currencyCode ?? checkout.currencyCode ?? "USD";

    const body = {
      shopDomain,
      affiliateCode: stored.affiliateCode,
      campaignCode: stored.campaignCode || null,
      orderId: String(orderId),
      orderName: order && "name" in order ? String(order.name) : null,
      totalAmount: total?.amount ?? "0",
      subtotalAmount: subtotal?.amount ?? total?.amount ?? "0",
      currency,
      pixelEventId: event.id,
      occurredAt: event.timestamp,
      clientId: event.clientId ?? null,
      sessionKey: checkout.token ?? null,
      landingPath: stored.landingPath,
      refOriginal: stored.affiliateCode,
    };

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      });
    } catch {
      /* noop: red intento; el comerciante puede reenviar desde logs del pixel si aplica */
    }
  });
});
