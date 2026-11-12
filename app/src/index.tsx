import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ResponsiveProvider } from "@hooks/useResponsive";

import { ThemeProvider } from "./utilities/ThemeProvider";
import SWRProvider from "./utilities/SWRProvider";
import App from "./App";

import { DarkModeProvider } from "@hooks/useDarkMode";

import ErrorBoundary from "@components/ErrorBoundary";

import "./utilities/ServiceWorkerRegister";

// The static app skeleton from index.html stays up until FullScreenLoader unmounts
// (see FullScreenLoader.tsx), so we intentionally don't hide it here.
const root = ReactDOM.createRoot(document.querySelector(".main-container")!);

root.render(
  <HelmetProvider>
    <DarkModeProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <SWRProvider>
            <ResponsiveProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <App />
              </BrowserRouter>
            </ResponsiveProvider>
          </SWRProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </DarkModeProvider>
  </HelmetProvider>
);
