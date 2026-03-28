import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
// ✅ ADD THIS
import { setBaseUrl } from "./lib/custom-fetch";

setBaseUrl("https://faculty-voting-system.onrender.com");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);