import { useRef } from "react";
import { useInView } from "framer-motion";

import { ChartWrap, AreaChartBox, AreaSvg, AreaFill, AreaLine, AreaDot, AreaAxis, AreaPeak } from "./Wrapped.styles";

type Props = {
  // One value per hour, index 0..23.
  values: number[];
};

const W = 240; // viewBox width
const H = 80; // viewBox height
const PAD_TOP = 10; // headroom above the peak so the line/stroke isn't clipped
const PAD_BOTTOM = 4; // small gap above the baseline

// Build a smooth path through the points using Catmull-Rom -> cubic bezier.
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// Hour-of-day distribution as a smooth area chart, with the peak hour marked.
function AreaChart({ values }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  const max = Math.max(1, ...values);
  const n = values.length;
  const points: [number, number][] = values.map((v, i) => {
    const x = (i / (n - 1)) * W;
    const y = PAD_TOP + (1 - v / max) * (H - PAD_TOP - PAD_BOTTOM);
    return [x, y];
  });

  const line = smoothPath(points);
  const area = `${line} L ${W},${H} L 0,${H} Z`;

  const peakHour = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  const peak = points[peakHour];
  // Peak position as percentages, so the dot stays a perfect small circle
  // (the SVG itself is stretched via preserveAspectRatio="none").
  const peakLeft = `${(peak[0] / W) * 100}%`;
  const peakTop = `${(peak[1] / H) * 100}%`;

  return (
    <ChartWrap ref={ref}>
      {/* Left-to-right reveal wipe. Animating a clip (not SVG pathLength) avoids
          stroke-dash glitches on the horizontally-stretched path. */}
      <AreaChartBox
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={inView ? { clipPath: "inset(0 0% 0 0)" } : { clipPath: "inset(0 100% 0 0)" }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        <AreaSvg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <AreaFill d={area} fill="currentColor" />
          <AreaLine d={line} />
        </AreaSvg>
        <AreaDot style={{ left: peakLeft, top: peakTop }} />
      </AreaChartBox>
      <AreaAxis>
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </AreaAxis>
      <AreaPeak>
        Most active around <strong>{formatHour(peakHour)}</strong>
      </AreaPeak>
    </ChartWrap>
  );
}

export default AreaChart;
