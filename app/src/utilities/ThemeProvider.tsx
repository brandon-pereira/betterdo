import { createGlobalStyle, ThemeProvider as _ThemeProvider } from "styled-components";

import { LIGHT_THEME, DARK_THEME } from "../theme";

import useDarkMode from "@hooks/useDarkMode";
import { MantineProvider } from "@mantine/core";

export function ThemeProvider({ children }: { children: React.ReactChild }) {
  const [isDarkMode] = useDarkMode();

  return (
    <MantineProvider
      forceColorScheme={isDarkMode ? "dark" : "light"}
      theme={
        {
          // primaryColor: "red"
        }
      }
    >
      <_ThemeProvider theme={isDarkMode ? DARK_THEME : LIGHT_THEME}>{children}</_ThemeProvider>
    </MantineProvider>
  );
}

export const GlobalStyles = createGlobalStyle`    
    :root {
        /* Global stacking order for app chrome. Spaced to leave room between
           layers. Local stacking contexts (modal internals, individual tasks,
           list items) keep their own small, self-contained values. */
        --z-navigation: 10;
        --z-logo: 30;
        --z-header: 40;
        --z-modal-overlay: 100;
    }
    html {
        overflow: hidden;
    }
    body {
        font-family:  'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        margin: 0;
        overflow: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        &.loaded {
            .loader {
                display: none;
            }
        }
    }

    html.app,
    .main-container,
    .app {
        width: 100vw;
        height: 100vh;
    }
`;
