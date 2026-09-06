import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";

// Global error listener to recover from stale PWA cache script chunk failures
window.addEventListener("error", (e) => {
  const msg = (e.message || "").toLowerCase();
  const targetSrc = (e.target?.src || e.filename || "").toLowerCase();
  if (
    msg.includes("loading chunk") ||
    msg.includes("module script") ||
    msg.includes("mime type") ||
    targetSrc.includes(".js")
  ) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) reg.unregister();
      });
    }
    window.location.reload();
  }
}, true);

// Register PWA Service Worker in production/supported browsers with auto-update
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (reg) => {
        console.log("PWA ServiceWorker registered: ", reg.scope);
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("New ServiceWorker update available, activating...");
              }
            };
          }
        };
      },
      (err) => console.log("PWA ServiceWorker registration failed: ", err)
    );
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <SocketContextProvider>
          <ThemeProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </ThemeProvider>
        </SocketContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);
