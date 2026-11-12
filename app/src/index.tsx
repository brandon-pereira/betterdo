import * as ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion } from "framer-motion";
import { ResponsiveProvider } from "@hooks/useResponsive";

import { ThemeProvider } from "./utilities/ThemeProvider";
import SWRProvider from "./utilities/SWRProvider";
import App from "./App";

import { DarkModeProvider } from "@hooks/useDarkMode";

import ErrorBoundary from "@components/ErrorBoundary";

import "./utilities/prefetch";
import "./utilities/ServiceWorkerRegister";

// The static app skeleton from index.html stays up until FullScreenLoader unmounts
// (see FullScreenLoader.tsx), so we intentionally don't hide it here.
const root = ReactDOM.createRoot(document.querySelector(".main-container")!);

const loadMotionFeatures = () => import("./utilities/motionFeatures").then(mod => mod.default);

root.render(
  // strict: throws if a full `motion.*` component is used instead of `m.*`, which would undo the split
  <LazyMotion features={loadMotionFeatures} strict>
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
  </LazyMotion>
);
