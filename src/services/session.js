let accessToken = null;
const listeners = new Set();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function subscribeToSessionEnd(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function endSession(reason) {
  accessToken = null;
  listeners.forEach((listener) => listener(reason));
}
