import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global fetch interceptor to inject JWT token automatically
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  const url = typeof resource === "string" ? resource : (resource instanceof Request ? resource.url : "");
  
  if (url.includes("/api/")) {
    const token = localStorage.getItem("gap_token") || localStorage.getItem("token");
    if (token) {
      config = config || {};
      if (config.headers instanceof Headers) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers = {
          ...config.headers,
          "Authorization": `Bearer ${token}`
        };
      }
    }
  }
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
