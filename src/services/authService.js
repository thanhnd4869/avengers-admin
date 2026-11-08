import { apiClient } from "./apiClient";
import { setAccessToken } from "./session";

function saveSession(response) {
  setAccessToken(response.data.accessToken);
  return response.data.user;
}

export async function login({ email, password }) {
  return saveSession(await apiClient.post("/auth/login", { email, password }));
}

export async function restoreSession() {
  const { data } = await apiClient.post("/auth/refresh");
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout() {
  try {
    await apiClient.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}
