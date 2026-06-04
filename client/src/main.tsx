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

createRoot(document.getElementById("root")!).render(<App />);
