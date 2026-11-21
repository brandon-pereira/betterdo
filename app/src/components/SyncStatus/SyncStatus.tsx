import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";

import { CloudAlert, CloudOff } from "lucide-react";

import { Button, Detail, DismissButton, Spinner, Title, Tooltip } from "./SyncStatus.styles";

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
  const [position, setPosition] = useState<{ top: number; left: number; arrowLeft: number } | null>(null);

  const [previousState, setPreviousState] = useState(state);

  // Once everything syncs the button disappears, so close the tooltip rather than
  // having it pop back open the next time the status shows.
  if (previousState !== state) {
    setPreviousState(state);
    if (state === "idle") {
      setPosition(null);
    }
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Touch devices don't hover or blur, so a tap anywhere else closes the tooltip.
  // It's fixed in place, so scrolling or resizing would leave it behind.
  useEffect(() => {
    if (!position) {
      return;
    }
    const close = () => setPosition(null);
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !tooltipRef.current?.contains(target)) {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  if (state === "idle") {
    return null;
  }

  let title = "Syncing…";
  let detail = `Saving ${pluralize(pendingChanges)} to your account.`;
  if (state === "failed") {
    title = "Changes undone";
    detail = `${pluralize(failedChanges)} couldn't be saved, so ${failedChanges === 1 ? "it was" : "they were"} undone.`;
  } else if (state === "offline") {
    title = "You're offline";
    detail =
      pendingChanges > 0
        ? `${pluralize(pendingChanges)} saved on this device will sync when you reconnect.`
        : "Changes you make are saved on this device and sync when you reconnect.";
  }
  const message = `${title}. ${detail}`;
  const icon =
    state === "syncing" ? (
      <Spinner aria-hidden />
    ) : state === "offline" ? (
      <CloudOff aria-hidden />
    ) : (
      <CloudAlert aria-hidden />
    );

  const show = () => {
    clearTimeout(hideTimer.current);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const center = rect.left + rect.width / 2;
    const maxLeft = window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(center - TOOLTIP_WIDTH / 2, maxLeft));
    setPosition({ top: rect.bottom + VIEWPORT_MARGIN + 2, left, arrowLeft: center - left });
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
        // Touch fires emulated mouse events and focuses on tap, which would open the
        // tooltip just before the click toggled it shut, so only real hover and
        // keyboard focus open it here and taps go through onClick.
        onPointerEnter={e => e.pointerType === "mouse" && show()}
        onPointerLeave={e => e.pointerType === "mouse" && hideSoon()}
        onFocus={e => e.currentTarget.matches(":focus-visible") && show()}
        onBlur={e => !tooltipRef.current?.contains(e.relatedTarget) && hide()}
        onPointerDown={e => (pointerType.current = e.pointerType)}
        onClick={() => {
          const wasMouse = pointerType.current === "mouse";
          pointerType.current = "";
          // Hover already opened it for a mouse; taps and Enter/Space toggle it.
          if (wasMouse || !position) {
            show();
          } else {
            hide();
          }
        }}
        onKeyDown={e => e.key === "Escape" && hide()}
      >
        {icon}
      </Button>
      {position &&
        createPortal(
          <Tooltip
            ref={tooltipRef}
            onPointerEnter={e => e.pointerType === "mouse" && keepOpen()}
            onPointerLeave={e => e.pointerType === "mouse" && hideSoon()}
            id={tooltipId}
            role="tooltip"
            style={
              {
                top: position.top,
                left: position.left,
                width: TOOLTIP_WIDTH,
                "--arrow-left": `${position.arrowLeft}px`
              } as CSSProperties
            }
          >
            <Title data-state={state}>
              {icon}
              {title}
            </Title>
            <Detail>{detail}</Detail>
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
