import * as ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ResponsiveProvider } from "@hooks/useResponsive";

import { ThemeProvider, GlobalStyles } from "./utilities/ThemeProvider";
import SWRProvider from "./utilities/SWRProvider";
import App from "./App";

import { DarkModeProvider } from "@hooks/useDarkMode";
import ErrorBoundary from "@components/ErrorBoundary";

import "./utilities/ServiceWorkerRegister";

const root = ReactDOM.createRoot(document.querySelector(".main-container")!);

document.body.classList.add("loaded");
document.querySelector("#critical-css")?.remove();

root.render(
  <HelmetProvider>
    <GlobalStyles />
    <DarkModeProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <SWRProvider>
            <ResponsiveProvider>
              <HashRouter>
                <App />
              </HashRouter>
            </ResponsiveProvider>
          </SWRProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </DarkModeProvider>
  </HelmetProvider>
);
