// Explicit React import — must be first so React is fully initialized
// before any lazy chunk's module-level React.createContext() calls execute.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
