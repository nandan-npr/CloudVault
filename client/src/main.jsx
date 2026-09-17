import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App";
import "./index.css";
import { initTheme } from "./utils/theme";

// Apply theme immediately before render to avoid flash
initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster richColors position="top-right" duration={2500} />
    </BrowserRouter>
  </React.StrictMode>
);
