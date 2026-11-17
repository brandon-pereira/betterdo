import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { createPortal } from "react-dom";

import { Anchor, Bubble } from "./Tooltip.styles";

type Placement = "top" | "bottom" | "left" | "right";

interface Props {
  label: string;
  placement?: Placement;
  children: ReactElement;
}

const HOVER_DELAY_MS = 400;
const GAP = 8;
const VIEWPORT_MARGIN = 8;
const OPPOSITE: Record<Placement, Placement> = { top: "bottom", bottom: "top", left: "right", right: "left" };

function getPosition(anchor: DOMRect, bubble: DOMRect, placement: Placement) {
  switch (placement) {
    case "top":
      return { top: anchor.top - bubble.height - GAP, left: anchor.left + (anchor.width - bubble.width) / 2 };
    case "bottom":
      return { top: anchor.bottom + GAP, left: anchor.left + (anchor.width - bubble.width) / 2 };
    case "left":
      return { top: anchor.top + (anchor.height - bubble.height) / 2, left: anchor.left - bubble.width - GAP };
    case "right":
      return { top: anchor.top + (anchor.height - bubble.height) / 2, left: anchor.right + GAP };
  }
}

const fits = ({ top, left }: { top: number; left: number }, bubble: DOMRect) =>
  top >= VIEWPORT_MARGIN &&
  left >= VIEWPORT_MARGIN &&
  top + bubble.height <= window.innerHeight - VIEWPORT_MARGIN &&
  left + bubble.width <= window.innerWidth - VIEWPORT_MARGIN;

const clamp = (value: number, max: number) => Math.max(VIEWPORT_MARGIN, Math.min(value, max - VIEWPORT_MARGIN));

/**
 * Shows a short label next to its child on hover (after a delay) or keyboard focus.
 * Usage: <Tooltip label="Settings"><button aria-label="Settings">…</button></Tooltip>
 */
function Tooltip({ label, placement = "top", children }: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isOpen, setOpen] = useState(false);
  const id = useId();

  const open = () => {
    clearTimeout(timer.current);
    setOpen(true);
  };
  const close = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Escape dismisses it, and scrolling would leave it behind, so both close it.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  // Positioned after render so the bubble's own size is known. Flips to the
  // other side when there's no room, then keeps it inside the viewport.
  useLayoutEffect(() => {
    const anchor = anchorRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current;
    if (!isOpen || !anchor || !bubble) {
      return;
    }
    const size = bubble.getBoundingClientRect();
    let position = getPosition(anchor, size, placement);
    if (!fits(position, size)) {
      const flipped = getPosition(anchor, size, OPPOSITE[placement]);
      if (fits(flipped, size)) {
        position = flipped;
      }
    }
    bubble.style.transform = `translate(${clamp(position.left, window.innerWidth - size.width)}px, ${clamp(position.top, window.innerHeight - size.height)}px)`;
  }, [isOpen, placement, label]);

  // The child usually has its own accessible name; only describe it when the label adds something.
  const child =
    isOpen && isValidElement<{ "aria-label"?: string; "aria-describedby"?: string }>(children)
      ? children.props["aria-label"] === label
        ? children
        : cloneElement(children, { "aria-describedby": id })
      : children;

  return (
    <>
      <Anchor
        ref={anchorRef}
        onPointerEnter={e => {
          // Touch has no hover, and a tap already runs the child's action.
          if (e.pointerType === "mouse") {
            clearTimeout(timer.current);
            timer.current = setTimeout(open, HOVER_DELAY_MS);
          }
        }}
        onPointerLeave={close}
        onPointerDown={close}
        onFocus={e => e.target.matches(":focus-visible") && open()}
        onBlur={close}
      >
        {child}
      </Anchor>
      {isOpen &&
        createPortal(
          <Bubble ref={bubbleRef} id={id} role="tooltip" style={{ transform: "translate(-9999px, -9999px)" }}>
            {label}
          </Bubble>,
          document.body
        )}
    </>
  );
}

export default Tooltip;
