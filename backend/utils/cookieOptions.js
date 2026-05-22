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

function obtenerDominiosPosiblesCookie() {
  const domains = new Set();
  const configuredDomain = process.env.COOKIE_DOMAIN?.trim();

  if (configuredDomain) {
    domains.add(configuredDomain);
    domains.add(configuredDomain.startsWith(".") ? configuredDomain.slice(1) : `.${configuredDomain}`);
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) return [...domains];

    const hostname = new URL(frontendUrl).hostname;
    if (!hostname || hostname === "localhost") return [...domains];
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return [...domains];

    domains.add(hostname);
    domains.add(`.${hostname}`);

    const parts = hostname.split(".").filter(Boolean);
    if (parts.length >= 2) {
      const rootDomain = parts.slice(-2).join(".");
      domains.add(rootDomain);
      domains.add(`.${rootDomain}`);
    }
  } catch {
    return [...domains];
  }

  return [...domains];
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

export function limpiarCookieAuth(res, cookieName = "auth_token") {
  const isProduction = process.env.NODE_ENV === "production";
  const sameSiteVariants = ["lax", "none"];
  const possibleDomains = [undefined, ...obtenerDominiosPosiblesCookie()];

  for (const sameSite of sameSiteVariants) {
    for (const domain of possibleDomains) {
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: isProduction,
        sameSite,
        path: "/",
        ...(domain ? { domain } : {}),
      });
    }
  }
}
