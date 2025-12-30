// src/api/refresh.web.ts
"use client";

import axios from "axios";

import { makeHeaders } from "./common";
import { BASE_URL, REQUEST_TIMEOUT_MS, SKEW_SECONDS } from "./config";
import { forceLogout } from "./forceLogout";
import { useAuth } from "./secure";

// src/api/refresh.web.ts

let expTimer: ReturnType<typeof setTimeout> | null = null;
let refreshPromise: Promise<void> | null = null;
let lastRefreshAt = 0;
let sessionInitialized = false;
let accessTokenExpiresAtISO: string | null = null;

export function clearAuthSchedulers() {
  if (expTimer) clearTimeout(expTimer);
  expTimer = null;
}

export function scheduleByExpireAt(expiresAt?: string | null, skew = SKEW_SECONDS) {
  accessTokenExpiresAtISO = expiresAt ?? null;
  if (expTimer) clearTimeout(expTimer);
  if (!expiresAt) return;

  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return;

  const delay = Math.max(5000, t - Date.now() - skew * 1000);
  expTimer = setTimeout(() => {
    safeRefresh().catch(() => {});
  }, delay);
}

export async function doRefresh(): Promise<void> {
  const client = makeRawClient();
  const headers = await makeHeaders();
  const res = await client.post("/auth/refresh-token", null, {
    headers,
  });

  const payload = (res.data?.data ?? res.data) as {
    access_token: string;
    access_token_expires_at?: string | null;
  };
  if (!payload?.access_token) throw new Error("Invalid refresh payload");

  useAuth.getState().setAccessToken(payload.access_token);
  sessionInitialized = true;
  scheduleByExpireAt(payload.access_token_expires_at ?? null);
}

export async function safeRefresh(): Promise<void> {
  try {
    if (!refreshPromise) refreshPromise = doRefresh();
    await refreshPromise;
    lastRefreshAt = Date.now();
  } catch (e) {
    if (sessionInitialized) await forceLogout();
    throw e instanceof Error ? e : new Error("Auto refresh failed");
  } finally {
    refreshPromise = null;
  }
}

export async function applyTokens(access_token: string, access_token_expires_at?: string | null) {
  useAuth.getState().setAccessToken(access_token);
  sessionInitialized = true;
  scheduleByExpireAt(access_token_expires_at ?? null);
}

export function makeRawClient() {
  return axios.create({
    baseURL: BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
  });
}
