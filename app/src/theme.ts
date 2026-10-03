import { QUERIES } from "./constants";

/**
 * Theme architecture (Linaria / zero-runtime).
 *
 * Linaria resolves style interpolations at build time, so it cannot read a
 * runtime theme object the way styled-components did. Instead every themeable
 * value is expressed as a CSS custom property reference (e.g. `var(--...)`).
 * The `theme` object below is a *static* map of those references and is safe to
 * interpolate inside Linaria `styled`/`css` templates.
 *
 * The concrete values for each custom property live in `LIGHT_VARS` / `DARK_VARS`
 * and are injected onto the document root by `ThemeProvider`, which swaps them
 * when dark mode toggles. This is what makes runtime theme switching work with a
 * zero-runtime CSS-in-JS library.
 */

const v = (name: string) => `var(--${name})`;

export const theme = {
  queries: QUERIES,
  colors: {
    navigation: {
      background: v("colors-navigation-background")
    },
    modals: {
      overlayBackground: v("colors-modals-overlay-background"),
      contentBackground: v("colors-modals-content-background"),
      listViewAlternateBackground: v("colors-modals-list-view-alternate-background")
    },
    forms: {
      input: {
        color: v("colors-forms-input-color"),
        background: v("colors-forms-input-background"),
        boxShadow: v("colors-forms-input-box-shadow"),
        borderColor: v("colors-forms-input-border-color")
      },
      label: {
        color: v("colors-forms-label-color")
      },
      selector: {
        background: v("colors-forms-selector-background"),
        color: v("colors-forms-selector-color"),
        boxShadow: v("colors-forms-selector-box-shadow")
      }
    },
    body: {
      color: v("colors-body-color"),
      background: v("colors-body-background"),
      banner: {
        color: v("colors-body-banner-color"),
        icon: {
          background: v("colors-body-banner-icon-background"),
          stroke: v("colors-body-banner-icon-stroke")
        }
      },
      completedTasksButton: {
        borderColor: v("colors-body-completed-tasks-button-border-color"),
        color: v("colors-body-completed-tasks-button-color"),
        textShadow: v("colors-body-completed-tasks-button-text-shadow")
      }
    },
    task: {
      background: v("colors-task-background"),
      boxShadow: v("colors-task-box-shadow"),
      color: v("colors-task-color"),
      checkbox: {
        background: v("colors-task-checkbox-background"),
        boxShadow: v("colors-task-checkbox-box-shadow")
      },
      checkboxDot: {
        background: v("colors-task-checkbox-dot-background")
      },
      lowPriority: {
        background: v("colors-task-low-priority-background")
      }
    },
    general: {
      blue: v("colors-general-blue"),
      red: v("colors-general-red")
    }
  },
  /**
   * Semantic tokens that previously relied on `theme.isDarkMode ? a : b`.
   * Each resolves to a different value per theme via the injected CSS vars.
   */
  effects: {
    glassBackground: v("effects-glass-background"),
    glassHighlight: v("effects-glass-highlight"),
    glassHighlightTop: v("effects-glass-highlight-top"),
    hoverOverlay: v("effects-hover-overlay"),
    tintStrong: v("effects-tint-strong"),
    tintMedium: v("effects-tint-medium"),
    tintActive: v("effects-tint-active"),
    subtleText: v("effects-subtle-text"),
    editTaskHeaderBackground: v("effects-edit-task-header-background"),
    editTaskHeaderBorder: v("effects-edit-task-header-border"),
    editTaskMutedText: v("effects-edit-task-muted-text"),
    editTaskFieldBackground: v("effects-edit-task-field-background"),
    editTaskFieldBorder: v("effects-edit-task-field-border"),
    editTaskFooterBackground: v("effects-edit-task-footer-background"),
    editTaskFooterBorder: v("effects-edit-task-footer-border"),
    settingsSectionBackground: v("effects-settings-section-background")
  }
} as const;

/** Concrete custom-property values for light mode. */
export const LIGHT_VARS: Record<string, string> = {
  "colors-navigation-background": "#202020",
  "colors-modals-overlay-background": "rgba(0,0,0,.5)",
  "colors-modals-content-background": "#fff",
  "colors-modals-list-view-alternate-background": "#EEE",
  "colors-forms-input-color": "#000",
  "colors-forms-input-background": "#FFF",
  "colors-forms-input-box-shadow": "inset 0 0 0 2px #ccc",
  "colors-forms-input-border-color": "#ccc",
  "colors-forms-label-color": "#666",
  "colors-forms-selector-background": "linear-gradient(#fff, #ddd)",
  "colors-forms-selector-color": "#000",
  "colors-forms-selector-box-shadow": "inset 0 0 0 1px #a2a2a2, inset 0 -2px #fff",
  "colors-body-color": "#222",
  "colors-body-background": "#e4e4e4",
  "colors-body-banner-color": "#999",
  "colors-body-banner-icon-background": "#cfcfcf",
  "colors-body-banner-icon-stroke": "#b5b5b5",
  "colors-body-completed-tasks-button-border-color": "#aaa",
  "colors-body-completed-tasks-button-color": "#666",
  "colors-body-completed-tasks-button-text-shadow": "0 1px #fff",
  "colors-task-background": "linear-gradient(#fff, #eee)",
  "colors-task-box-shadow": "0 2px 3px rgba(0, 0, 0, 0.2), inset 0 -1px #fff",
  "colors-task-color": "#000",
  "colors-task-checkbox-background": "#fff",
  "colors-task-checkbox-box-shadow": "inset 0 0 0 1px rgba(0, 0, 0, 0.2), 1px 1px #fff",
  "colors-task-checkbox-dot-background": "linear-gradient(#333, #666)",
  "colors-task-low-priority-background": "linear-gradient(#eee, #ddd)",
  "colors-general-blue": "#0d3e90",
  "colors-general-red": "#c62828",
  "effects-glass-background": "#fff",
  "effects-glass-highlight": "rgba(255, 255, 255, 0.6)",
  "effects-glass-highlight-top": "rgba(255, 255, 255, 0.8)",
  "effects-hover-overlay": "rgba(0, 0, 0, 0.04)",
  "effects-tint-strong": "rgba(0, 0, 0, 0.1)",
  "effects-tint-medium": "rgba(0, 0, 0, 0.05)",
  "effects-tint-active": "rgba(0, 0, 0, 0.1)",
  "effects-subtle-text": "#999",
  "effects-edit-task-header-background": "rgba(255, 255, 255, 0.4)",
  "effects-edit-task-header-border": "rgba(0, 0, 0, 0.06)",
  "effects-edit-task-muted-text": "rgba(0, 0, 0, 0.4)",
  "effects-edit-task-field-background": "rgba(0, 0, 0, 0.04)",
  "effects-edit-task-field-border": "rgba(0, 0, 0, 0.08)",
  "effects-edit-task-footer-background": "rgba(255, 255, 255, 0.45)",
  "effects-edit-task-footer-border": "rgba(255, 255, 255, 0.5)",
  "effects-settings-section-background": "rgba(0, 0, 0, 0.015)"
};

/** Concrete custom-property values for dark mode. */
export const DARK_VARS: Record<string, string> = {
  "colors-navigation-background": "#080808",
  "colors-modals-overlay-background": "rgba(0,0,0,.7)",
  "colors-modals-content-background": "#171717",
  "colors-modals-list-view-alternate-background": "#212121",
  "colors-forms-input-color": "#fff",
  "colors-forms-input-background": "#1e1e1e",
  "colors-forms-input-box-shadow": "inset 0 -1px #313131",
  "colors-forms-input-border-color": "#313131",
  "colors-forms-label-color": "#a5a5a5",
  "colors-forms-selector-background": "linear-gradient(#252525, #151515)",
  "colors-forms-selector-color": "#b5b5b5",
  "colors-forms-selector-box-shadow": "inset 0 0 0 1px rgba(0, 0, 0, 0.9), inset 0 -2px rgba(255, 255, 255, 0.3)",
  "colors-body-color": "#d2d2d2",
  "colors-body-background": "#101010",
  "colors-body-banner-color": "#9e9e9e",
  "colors-body-banner-icon-background": "#191919",
  "colors-body-banner-icon-stroke": "#282828",
  "colors-body-completed-tasks-button-border-color": "#313131",
  "colors-body-completed-tasks-button-color": "#616161",
  "colors-body-completed-tasks-button-text-shadow": "none",
  "colors-task-background": "linear-gradient(#252525, #1e1e1e)",
  "colors-task-box-shadow": "0 2px 3px rgba(0, 0, 0, 0.2), inset 0 -1px #000",
  "colors-task-color": "#fff",
  "colors-task-checkbox-background": "linear-gradient(rgba(255, 255, 255, 0.07), transparent)",
  "colors-task-checkbox-box-shadow": "inset 0 0 0 2px rgba(0, 0, 0, 0.1), 0 0 1px 1px rgba(0, 0, 0, 0.5)",
  "colors-task-checkbox-dot-background": "linear-gradient(rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.9))",
  "colors-task-low-priority-background": "linear-gradient(#151515,#131313)",
  "colors-general-blue": "#2979ff",
  "colors-general-red": "#c62828",
  "effects-glass-background": "rgba(30, 30, 30, 0.7)",
  "effects-glass-highlight": "rgba(255, 255, 255, 0.08)",
  "effects-glass-highlight-top": "rgba(255, 255, 255, 0.05)",
  "effects-hover-overlay": "rgba(255, 255, 255, 0.06)",
  "effects-tint-strong": "rgba(255, 255, 255, 0.1)",
  "effects-tint-medium": "rgba(255, 255, 255, 0.1)",
  "effects-tint-active": "rgba(255, 255, 255, 0.15)",
  "effects-subtle-text": "#888",
  "effects-edit-task-header-background": "rgba(30, 30, 30, 0.5)",
  "effects-edit-task-header-border": "rgba(255, 255, 255, 0.06)",
  "effects-edit-task-muted-text": "rgba(255, 255, 255, 0.5)",
  "effects-edit-task-field-background": "rgba(255, 255, 255, 0.04)",
  "effects-edit-task-field-border": "rgba(255, 255, 255, 0.08)",
  "effects-edit-task-footer-background": "rgba(20, 20, 20, 0.5)",
  "effects-edit-task-footer-border": "rgba(255, 255, 255, 0.06)",
  "effects-settings-section-background": "rgba(255, 255, 255, 0.02)"
};
