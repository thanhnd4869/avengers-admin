import axios from "axios";

import { endSession, getAccessToken, setAccessToken } from "./session";

const API_URL =
  typeof process.env.WEBPACK_API_URL === "string" && process.env.WEBPACK_API_URL
    ? process.env.WEBPACK_API_URL
    : "http://localhost:8000/api/v1";

const config = {
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
};
const client = axios.create(config);
const refreshClient = axios.create(config);
let refreshing = null;

function toApiError(cause) {
  if (!axios.isAxiosError(cause)) return cause;
  const error = cause.response?.data?.error;
  const result = new Error(
    error?.message ?? (cause.response ? "The request failed." : "Unable to reach the server."),
  );
  result.status = cause.response?.status;
  result.code = error?.code ?? (cause.response ? "INTERNAL_ERROR" : "NETWORK_ERROR");
  result.requestId = error?.requestId ?? cause.response?.headers?.["x-request-id"];
  // `[{ field, message }]`, so a form can show each message by its field.
  result.details = error?.details ?? [];
  return result;
}

function refreshSession() {
  if (!refreshing) {
    refreshing = refreshClient
      .post("/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        return data.data;
      })
      .catch((cause) => {
        throw toApiError(cause);
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

client.interceptors.request.use((request) => {
  const token = getAccessToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

client.interceptors.response.use(
  (response) => response.data,
  async (cause) => {
    const error = toApiError(cause);
    const request = cause.config;
    if (error.status !== 401 || !request?.headers?.Authorization) throw error;

    if (request.retried) {
      endSession("expired");
      throw error;
    }

    try {
      await refreshSession();
    } catch (refreshError) {
      endSession(refreshError.code === "SESSION_REVOKED" ? "revoked" : "expired");
      throw error;
    }

    request.retried = true;
    return client(request);
  },
);

export const apiClient = {
  get: (path, options) => client.get(path, options),
  post: (path, body, options) => client.post(path, body, options),
  patch: (path, body, options) => client.patch(path, body, options),
  delete: (path, options) => client.delete(path, options),
};
