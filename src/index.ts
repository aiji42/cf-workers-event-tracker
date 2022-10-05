import { Hono } from "hono";
import type { Database } from "@cloudflare/d1";
import { D1QB } from "workers-qb";
import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";

interface Bindings {
  DB: Database;
}

const VISIT_TOKEN_NAME = "visit-token";
const VISITOR_TOKEN_NAME = "visitor-token";
const VISIT_DURATION = 30 * 60; // sec
const VISITOR_COOKIE_MAX_AGE = 3600 * 24 * 365; // sec

const cookieOption = {
  httpOnly: true,
  secure: false, // FIXME: true on production
  maxAge: VISIT_DURATION,
  sameSite: "Lax",
  path: "/",
} as const;

const app = new Hono<{ Bindings: Bindings }>();

app.get("/__tracking/pageview", async (c) => {
  const visitToken = c.req.cookie(VISIT_TOKEN_NAME) ?? uuidv4();
  const visitorToken = c.req.cookie(VISITOR_TOKEN_NAME) ?? uuidv4();
  c.cookie(VISIT_TOKEN_NAME, visitToken, cookieOption);
  c.cookie(VISITOR_TOKEN_NAME, visitorToken, {
    ...cookieOption,
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });

  const qb = new D1QB(c.env.DB);
  try {
    const ua = UAParser(c.req.headers.get("User-Agent") ?? "");
    const url = new URL(c.req.url);
    await qb.insert({
      tableName: "Visit",
      data: {
        visitToken,
        visitorToken,
        longitude: c.req.cf?.longitude ? Number(c.req.cf?.longitude) : null,
        latitude: c.req.cf?.latitude ? Number(c.req.cf?.latitude) : null,
        continent: c.req.cf?.continent ?? null,
        country: c.req.cf?.country ?? null,
        city: c.req.cf?.city ?? null,
        region: c.req.cf?.region ?? null,
        regionCode: c.req.cf?.regionCode ?? null,
        postalCode: c.req.cf?.postalCode ?? null,
        timezone: c.req.cf?.timezone ?? null,
        ip: c.req.headers.get("CF-Connecting-IP"),
        referrer: c.req.headers.get("Referer"),
        referringDomain: c.req.headers.get("Referer")
          ? new URL(c.req.headers.get("Referer")!).host
          : null,
        userAgent: c.req.headers.get("User-Agent"),
        landingPage: url.toString(),
        browser: ua.browser.name ?? null,
        browserVersion: ua.browser.version ?? null,
        os: ua.os.name ?? null,
        osVersion: ua.os.version ?? null,
        deviceType: ua.device.type ?? null,
        deviceModel: ua.device.model ?? null,
        deviceVendor: ua.device.vendor ?? null,
        utmSource: url.searchParams.get("utm_source"),
        utmMedium: url.searchParams.get("utm_medium"),
        utmTerm: url.searchParams.get("utm_term"),
        utmContent: url.searchParams.get("utm_content"),
        utmCampaign: url.searchParams.get("utm_campaign"),
        startedAt: new Date().toISOString(),
      },
    });
  } catch (_) {}

  return c.json({}, 200);
});

export default app;
