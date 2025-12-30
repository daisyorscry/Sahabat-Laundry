"use client";

async function getDeviceId(): Promise<string> {
  if (typeof window === "undefined") return "srv";
  const KEY = "sl_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + "-web";
    localStorage.setItem(KEY, id);
  }
  return id;
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "edge";
  if (/firefox|fxios/i.test(ua)) return "firefox";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "safari";
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) return "chrome";
  return "web";
}
function detectPlatform(): string {
  if (typeof navigator === "undefined") return "web";
  // @ts-expect-error experimental
  const p = navigator.userAgentData?.platform ?? navigator.platform ?? "web";
  return String(p).toLowerCase();
}

let deviceMetaPromise: Promise<Record<string, string>> | null = null;

async function getDeviceMeta(): Promise<Record<string, string>> {
  if (deviceMetaPromise) return deviceMetaPromise;
  deviceMetaPromise = (async () => {
    const devId = await getDeviceId();
    const meta: Record<string, string> = {
      "x-device-id": devId,
      "x-device-type": "web",
      "x-platform": detectPlatform(),
      "x-browser": detectBrowser(),
    };
    return meta;
  })();
  return deviceMetaPromise;
}

type Coords = { lat: number; lon: number; at: number };
const LOCATION_TTL_MS = 10 * 60 * 1000;
let coordsCache: Coords | null = null;
let locationInitRunning = false;

async function queryGeoPermission(): Promise<"granted" | "prompt" | "denied" | "unknown"> {
  try {
    if (typeof navigator === "undefined" || !("permissions" in navigator)) return "unknown";
    const st = await navigator.permissions.query({ name: "geolocation" });
    return (st?.state as any) ?? "unknown";
  } catch {
    return "unknown";
  }
}

function getCurrentPosition(opts?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

async function getFreshCoords(): Promise<Coords | null> {
  try {
    const perm = await queryGeoPermission();
    if (perm === "denied") return null;
    const pos = await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 30000,
    });
    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      at: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function ensureCoords(): Promise<Coords | null> {
  if (typeof window === "undefined") return null;

  if (!coordsCache && !locationInitRunning) {
    locationInitRunning = true;
    coordsCache = await getFreshCoords();
    locationInitRunning = false;
    return coordsCache;
  }
  if (coordsCache && Date.now() - coordsCache.at > LOCATION_TTL_MS && !locationInitRunning) {
    locationInitRunning = true;
    getFreshCoords()
      .then((c) => {
        if (c) coordsCache = c;
      })
      .finally(() => {
        locationInitRunning = false;
      });
  }
  return coordsCache;
}

export async function makeHeaders(opts?: {
  bearer?: string;
  extra?: Record<string, string>;
}): Promise<Record<string, string>> {
  const meta = await getDeviceMeta();
  const base: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    "x-sahabatlaundry": "web",
    "x-timestamp": new Date().toISOString(),
    ...meta,
  };
  if (opts?.bearer) base["authorization"] = `Bearer ${opts.bearer}`;
  if (opts?.extra) Object.assign(base, opts.extra);
  return base;
}

export async function makeHeadersWithCoords(opts?: {
  bearer?: string;
  extra?: Record<string, string>;
}): Promise<Record<string, string>> {
  const coords = await ensureCoords();
  const extra = {
    ...(opts?.extra ?? {}),
    ...(coords ? { "x-latitude": String(coords.lat), "x-longitude": String(coords.lon) } : {}),
  };
  return makeHeaders({ bearer: opts?.bearer, extra });
}
