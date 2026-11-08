import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { config } from "@fortawesome/fontawesome-svg-core";

import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./styles.css";

// Icon CSS is bundled above instead of injected at runtime, as in the shop.
config.autoAddCss = false;

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element was not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
