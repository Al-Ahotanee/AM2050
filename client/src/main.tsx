import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Background sync registration if supported
        if ("sync" in reg) {
          (reg as any).sync.register("sync-am2050-field-records").catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("PWA Service worker registration failed:", err);
      });
  });
}
