import { Context, Hono } from "hono";
import type { Database } from "@cloudflare/d1";
import { D1QB } from "workers-qb";
import { v4 as uuidv4 } from "uuid";
import { UAParser } from "ua-parser-js";
import { serialize } from "cookie";

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
  sameSite: "lax",
  path: "/",
} as const;

const app = new Hono<{ Bindings: Bindings }>();

app.all("/proxy", (c) => c.json({ m: "proxy" }));

app.get("*", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = "/proxy";
  const res = await fetch(new Request(url.toString(), c.req.clone()));

  const visitToken = c.req.cookie(VISIT_TOKEN_NAME) ?? uuidv4();
  const visitorToken = c.req.cookie(VISITOR_TOKEN_NAME) ?? uuidv4();

  c.executionCtx.waitUntil(
    (async () => {
      const qb = new D1QB(c.env.DB);
      await Promise.all([
        insertVisit(c, visitToken, visitorToken, qb),
        insertEvent(c, visitToken, visitorToken, qb),
      ]);
    })()
  );

  const newHead = new Headers(res.headers);
  newHead.append("Set-Cookie", serialize(VISIT_TOKEN_NAME, visitToken, cookieOption));
  newHead.append(
    "Set-Cookie",
    serialize(VISITOR_TOKEN_NAME, visitorToken, {
      ...cookieOption,
      maxAge: VISITOR_COOKIE_MAX_AGE,
    })
  );

  return new Response(res.body, { headers: newHead });
});

const getMetadata = (c: Context) => {
  const ua = UAParser(c.req.headers.get("User-Agent") ?? "");

  return {
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
    userAgent: c.req.headers.get("User-Agent"),
    browser: ua.browser.name ?? null,
    browserVersion: ua.browser.version ?? null,
    os: ua.os.name ?? null,
    osVersion: ua.os.version ?? null,
    deviceType: ua.device.type ?? null,
    deviceModel: ua.device.model ?? null,
    deviceVendor: ua.device.vendor ?? null,
  };
};

const insertVisit = async (c: Context, visitToken: string, visitorToken: string, qb: D1QB) => {
  const url = new URL(c.req.url);

  try {
    await qb.insert({
      tableName: "Visit",
      data: {
        visitToken,
        visitorToken,
        ...getMetadata(c),
        referrer: c.req.headers.get("Referer"),
        referringDomain: c.req.headers.get("Referer")
          ? new URL(c.req.headers.get("Referer")!).host
          : null,
        landingPage: url.toString(),
        utmSource: url.searchParams.get("utm_source"),
        utmMedium: url.searchParams.get("utm_medium"),
        utmTerm: url.searchParams.get("utm_term"),
        utmContent: url.searchParams.get("utm_content"),
        utmCampaign: url.searchParams.get("utm_campaign"),
        startedAt: new Date().toISOString(),
      },
    });
  } catch (_) {}
};

const insertEvent = async (c: Context, visitToken: string, visitorToken: string, qb: D1QB) => {
  const url = new URL(c.req.url);

  try {
    await qb.insert({
      tableName: "Event",
      data: {
        visitToken,
        key: "pageview",
        value: "",
        href: url.href,
        orign: url.origin,
        protcol: url.protocol,
        host: url.host,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        ...getMetadata(c),
        time: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error(e);
  }
};

export default app;
