/**
 * Captura de ref en el cliente (storefront).
 * Clave alineada con el Web Pixel (cae_affiliate_engine_v1) para el mismo comercio.
 */
(function refCaptureStorefront() {
  var STORAGE_KEY = "cae_affiliate_engine_v1";
  var COOKIE_PREFIX = "cae_ref_";

  function readQueryParams() {
    try {
      var q = new URLSearchParams(window.location.search);
      return {
        ref: (q.get("ref") || "").trim(),
        camp: (q.get("camp") || "").trim(),
      };
    } catch {
      return { ref: "", camp: "" };
    }
  }

  function setCookie(name, value, maxAgeSec) {
    try {
      var enc = encodeURIComponent(value);
      document.cookie =
        name +
        "=" +
        enc +
        ";path=/;max-age=" +
        String(maxAgeSec) +
        ";SameSite=Lax";
    } catch {
      /* noop */
    }
  }

  function persist(ref, camp) {
    if (!ref) return;
    var landing = (window.location && window.location.pathname) || "/";
    var payload = {
      affiliateCode: ref.toUpperCase(),
      campaignCode: camp ? camp.toUpperCase() : "",
      capturedAt: new Date().toISOString(),
      landingPath: landing,
      source: "storefront_theme",
    };
    var json = JSON.stringify(payload);
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      /* noop */
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, json);
    } catch {
      /* noop */
    }
    setCookie(COOKIE_PREFIX + "payload", json, 60 * 60 * 24 * 30);
  }

  function run() {
    var p = readQueryParams();
    persist(p.ref, p.camp);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
