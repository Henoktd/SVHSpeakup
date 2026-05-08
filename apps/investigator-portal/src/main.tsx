import React from "react";
import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { App } from "./App";
import { investigatorMsalInstance } from "./authConfig";
import "./styles.css";

async function renderApp() {
  if (investigatorMsalInstance) {
    await investigatorMsalInstance.initialize();
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {investigatorMsalInstance ? (
        <MsalProvider instance={investigatorMsalInstance}>
          <App />
        </MsalProvider>
      ) : (
        <App />
      )}
    </React.StrictMode>
  );
}

void renderApp();
