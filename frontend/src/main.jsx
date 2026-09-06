import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { CallProvider } from "./context/CallContext.jsx";

// Register PWA Service Worker in production/supported browsers
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (reg) => console.log("PWA ServiceWorker registered: ", reg.scope),
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
