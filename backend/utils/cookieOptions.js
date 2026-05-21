function obtenerCookieDomain() {
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();
  if (configuredDomain) return configuredDomain;

  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) return undefined;

    const hostname = new URL(frontendUrl).hostname;
    if (!hostname || hostname === "localhost") return undefined;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return undefined;

    const parts = hostname.split(".").filter(Boolean);
    if (parts.length < 2) return undefined;

    return `.${parts.slice(-2).join(".")}`;
  } catch {
    return undefined;
  }
}

export function construirOpcionesCookie({ maxAge } = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const domain = obtenerCookieDomain();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "lax" : "lax",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
    ...(domain ? { domain } : {}),
  };
}
