import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const pageTitle = "Laica — Cook with what you have";
const pageDescription =
  "A cooking assistant that helps turn what’s already in your kitchen into a meal idea.";

document.title = pageTitle;

const metaDescription =
  document.querySelector<HTMLMetaElement>('meta[name="description"]') ??
  document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = pageDescription;
if (!metaDescription.isConnected) {
  document.head.appendChild(metaDescription);
}

async function renderApp() {
  if (import.meta.env.DEV && import.meta.env.VITE_LAICA_DEV_AUTH_BROWSER === "true") {
    try {
      const { consumeDevAuthCustomTokenForDev } = await import("./lib/firebase");
      await consumeDevAuthCustomTokenForDev();
    } catch (error) {
      console.error("Dev auth browser bootstrap failed:", error);
    }
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

void renderApp();
