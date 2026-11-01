import { useCallback, useEffect, useRef, useState } from "react";

function useInstall() {
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallAvailable, setAvailable] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Prevent automatically showing the prompt
      e.preventDefault();
      // Store event for later use
      installPrompt.current = e as BeforeInstallPromptEvent;
      // Notify listeners
      if (!localStorage.getItem("banners.a2hDisabled")) {
        setAvailable(true);
      }
    };
    const onAppInstalled = () => {
      // User installed the app, hide the notification
      setAvailable(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const onRequestInstall = useCallback(async () => {
    // The prompt event can only be used once, so hide the banner either way.
    setAvailable(false);
    // No event stored, short circuit
    if (!installPrompt.current) {
      return;
    }
    // Show the dialog
    installPrompt.current.prompt();
    const result = await installPrompt.current.userChoice;
    installPrompt.current = null;
    if (result.outcome === "accepted") {
      return true;
    } else {
      return false;
    }
  }, []);

  const onDeclineInstall = useCallback(() => {
    localStorage.setItem("banners.a2hDisabled", "true");
    setAvailable(false);
  }, []);

  return { onRequestInstall, onDeclineInstall, isInstallAvailable };
}

export default useInstall;
