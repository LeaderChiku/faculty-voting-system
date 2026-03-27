import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl("https://faculty-voting-system.onrender.com");
createRoot(document.getElementById("root")!).render(<App />);
