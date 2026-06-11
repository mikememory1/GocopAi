import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;

try {
  createRoot(rootEl).render(<App />);
} catch (err) {
  rootEl.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:sans-serif;text-align:center;padding:2rem;gap:1rem;">
      <h1 style="font-size:1.5rem;margin:0;">GoCopyAI failed to load</h1>
      <p style="color:#aaa;margin:0;">${err instanceof Error ? err.message : String(err)}</p>
      <p style="color:#666;font-size:0.875rem;margin:0;">Please try refreshing the page.</p>
    </div>
  `;
}
