const parseEnv = (key, fallback) => {
  const raw = import.meta.env[key];
  return typeof raw === "string" && raw.length > 0 ? raw : fallback;
};

/** Empty string = same-origin (Vite dev proxy → Spring Boot) */
export const API_BASE_URL = parseEnv(
  "VITE_API_URL",
  typeof window !== "undefined" ? "" : "http://localhost:8080"
);

export const WS_URL = parseEnv(
  "VITE_WS_URL",
  typeof window !== "undefined" ? `${window.location.origin}/ws` : "http://localhost:8080/ws"
);
