import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// ✅ setBaseUrl from the shared library — sets the URL for ALL generated API hooks
import { setBaseUrl } from "@workspace/api-client-react";

// Base URL must be the host only — generated paths already include /api/...
setBaseUrl("https://faculty-voting-system.onrender.com");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);