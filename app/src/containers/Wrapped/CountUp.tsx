import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, m, useInView } from "framer-motion";

import formatNumber from "@utilities/formatNumber";

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
};

// Animated number that counts up from 0 when scrolled into view.
function CountUp({ value, duration = 1.5, decimals = 0, suffix = "", prefix = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => {
    const factor = 10 ** decimals;
    const rounded = Math.round(latest * factor) / factor;
    return decimals > 0 ? rounded.toFixed(decimals) : formatNumber(Math.round(rounded));
  });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [inView, value, duration, count]);

  return (
    <span ref={ref}>
      {prefix}
      <m.span>{rounded}</m.span>
      {suffix}
    </span>
  );
}

export default CountUp;
