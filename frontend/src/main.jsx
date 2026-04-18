import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ── Global fetch interceptor ──────────────────────────────────────────
// Automatically injects JWT token into every /api/ request and handles
// 401 authentication errors (expired/invalid token) app-wide.
const _origFetch = window.fetch;
let _authErrorHandled = false; // prevent multiple logout dialogs

window.fetch = async function (...args) {
  let [resource, config] = args;
  const url = typeof resource === "string" ? resource
    : (resource instanceof Request ? resource.url : "");

  // Inject Authorization header for all API calls
  if (url.includes("/api/")) {
    // Normalize: always use gap_token (canonical key)
    const token = localStorage.getItem("gap_token");
    if (token) {
      config = config ? { ...config } : {};
      if (config.headers instanceof Headers) {
        if (!config.headers.has("Authorization")) {
          config.headers.set("Authorization", `Bearer ${token}`);
        }
      } else {
        config.headers = {
          "Authorization": `Bearer ${token}`,
          ...(config.headers || {}),
        };
      }
    }
  }

  const response = await _origFetch(resource, config);

  // Handle 401 globally — but skip login endpoint itself
  if (response.status === 401 && !url.includes("/api/auth/login") && !_authErrorHandled) {
    const cloned = response.clone();
    try {
      const errData = await cloned.json();
      const code = errData?.code || "";
      // Only auto-logout for invalid/expired token, not for missing-auth on public routes
      if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED" || code === "AUTH_REQUIRED") {
        _authErrorHandled = true;
        // Clear stored credentials
        localStorage.removeItem("gap_token");
        localStorage.removeItem("gap_user");
        const msg = code === "TOKEN_EXPIRED"
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.";
        // Show alert then reload (React state will show login page)
        setTimeout(() => {
          alert("⚠️ " + msg);
          window.location.reload();
          _authErrorHandled = false;
        }, 100);
      }
    } catch (_) {}
  }

  return response;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
