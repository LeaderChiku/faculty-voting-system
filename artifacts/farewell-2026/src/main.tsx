import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@/lib/custom-fetch";

setBaseUrl("https://faculty-voting-system.onrender.com");
createRoot(document.getElementById("root")!).render(<App />);
