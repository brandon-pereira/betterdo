import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button, Dot, DismissButton, Spinner, Tooltip } from "./SyncStatus.styles";

import useSyncStatus from "@hooks/useSyncStatus";

interface Props {
  className?: string;
}

const TOOLTIP_WIDTH = 240;
const VIEWPORT_MARGIN = 8;

const pluralize = (count: number) => `${count} ${count === 1 ? "change" : "changes"}`;

// Hidden while everything is synced, so it only appears when there's something to know.
function SyncStatus({ className }: Props) {
  const { state, pendingChanges, failedChanges, dismissFailedChanges } = useSyncStatus();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pointerType = useRef("");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tooltipId = useId();
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Touch devices don't hover or blur, so a tap anywhere else closes the tooltip.
  useEffect(() => {
    if (!position) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !tooltipRef.current?.contains(target)) {
        setPosition(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [position]);

  if (state === "idle") {
    return null;
  }

  let message = `Syncing ${pluralize(pendingChanges)}…`;
  if (state === "failed") {
    message = `${pluralize(failedChanges)} couldn't be saved, so ${failedChanges === 1 ? "it was" : "they were"} undone.`;
  } else if (state === "offline") {
    message =
      pendingChanges > 0
        ? `You're offline. ${pluralize(pendingChanges)} saved on this device will sync when you reconnect.`
        : "You're offline. Changes you make are saved on this device and sync when you reconnect.";
  }

  const show = () => {
    clearTimeout(hideTimer.current);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const centered = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN;
    setPosition({ top: rect.bottom + VIEWPORT_MARGIN, left: Math.max(VIEWPORT_MARGIN, Math.min(centered, maxLeft)) });
  };
  const hide = () => {
    clearTimeout(hideTimer.current);
    setPosition(null);
  };
  // Gives the mouse time to cross the gap into the tooltip (e.g. to click Dismiss).
  const hideSoon = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, 150);
  };
  const keepOpen = () => clearTimeout(hideTimer.current);

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        className={className}
        data-state={state}
        aria-label={message}
        aria-describedby={position ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocus={show}
        onBlur={hide}
        onPointerDown={e => (pointerType.current = e.pointerType)}
        // A mouse already opened it on hover/focus; a tap toggles it.
        onClick={() => (pointerType.current !== "mouse" && position ? hide() : show())}
        onKeyDown={e => e.key === "Escape" && hide()}
      >
        {state === "syncing" ? <Spinner size={18} aria-hidden /> : <Dot data-state={state} />}
      </Button>
      {position &&
        createPortal(
          <Tooltip
            ref={tooltipRef}
            onMouseEnter={keepOpen}
            onMouseLeave={hideSoon}
            id={tooltipId}
            role="tooltip"
            style={{ top: position.top, left: position.left, width: TOOLTIP_WIDTH }}
          >
            {message}
            {state === "failed" && (
              <DismissButton
                type="button"
                // Keeps focus on the status button so the tooltip stays open for the click.
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  dismissFailedChanges();
                  hide();
                }}
              >
                Dismiss
              </DismissButton>
            )}
          </Tooltip>,
          document.body
        )}
    </>
  );
}

export default SyncStatus;
