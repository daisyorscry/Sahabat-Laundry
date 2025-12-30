let handler: null | (() => Promise<void> | void) = null;

export function registerForceLogout(h: () => Promise<void> | void) {
  handler = h;
}

export async function forceLogout() {
  if (handler) await handler();
}
