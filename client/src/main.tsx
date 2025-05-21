import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set document title
document.title = "CulinaryAI - Your AI Cooking Assistant";

// Add meta description for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'AI-powered cooking assistant that helps with meal planning, grocery shopping, and step-by-step cooking guidance for home chefs.';
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(<App />);
