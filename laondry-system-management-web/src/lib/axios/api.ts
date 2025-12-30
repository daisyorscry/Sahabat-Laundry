// src/api/client.ts
"use client";

import axios, { AxiosError, AxiosHeaders, AxiosInstance, AxiosRequestConfig } from "axios";

import { makeHeadersWithCoords } from "./common";
import { BASE_URL, REQUEST_TIMEOUT_MS } from "./config";
import { forceLogout } from "./forceLogout";
import { safeRefresh } from "./refresh";
import { getAccessTokenSync } from "./secure";

// src/api/client.ts

function ensureAxiosHeaders(h: unknown): AxiosHeaders {
  if (h instanceof AxiosHeaders) return h;
  if (typeof h === "string") return new AxiosHeaders(h);
  return new AxiosHeaders((h ?? {}) as any);
}

export function makeApi(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  });

  instance.interceptors.request.use(async (config) => {
    const at = getAccessTokenSync();
    const std = await makeHeadersWithCoords({ bearer: at ?? undefined });

    const headers = ensureAxiosHeaders(config.headers);
    for (const [k, v] of Object.entries(std)) headers.set(k, v as any);

    if (!headers.has("x-request-id")) {
      const rid = (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).slice(2)) as string;
      headers.set("x-request-id", rid);
    }

    config.headers = headers;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
      const resp = err.response;
      const cfg = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
      if (!resp || !cfg) throw err;

      const status = resp.status ?? 0;
      const url = String(cfg.url || "");
      const isRefreshEndpoint = url.includes("/auth/refresh-token");
      const unauthorized = status === 401 || status === 419;

      if (unauthorized && !isRefreshEndpoint) {
        if (cfg._retry) {
          await forceLogout();
          throw err;
        }
        cfg._retry = true;

        try {
          await safeRefresh();

          const newAt = getAccessTokenSync();
          if (newAt) {
            const retryHeaders = ensureAxiosHeaders(cfg.headers);
            retryHeaders.set("Authorization", `Bearer ${newAt}`);
            cfg.headers = retryHeaders;
          }

          return instance(cfg);
        } catch (e) {
          await forceLogout();
          throw e;
        }
      }

      // Retry ringan utk 429 sekali
      if (status === 429 && !cfg._retry) {
        cfg._retry = true;
        const retryAfterSecs =
          Number(resp.headers?.["retry-after"]) || Number(resp.headers?.["x-ratelimit-reset"]) || 1;
        const delayMs = Math.max(500, retryAfterSecs * 1000);
        await new Promise((r) => setTimeout(r, delayMs));
        return instance(cfg);
      }

      throw err;
    }
  );

  return instance;
}

let _apiSingleton: AxiosInstance | null = null;
export function api(): AxiosInstance {
  if (!_apiSingleton) _apiSingleton = makeApi();
  return _apiSingleton;
}
