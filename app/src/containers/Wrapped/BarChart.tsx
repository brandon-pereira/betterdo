import { useRef } from "react";
import type { CSSProperties } from "react";
import { useInView } from "framer-motion";

import { ChartWrap, Bars, BarColumn, BarValueSlot, BarTrack, Bar, BarLabel, BarValue } from "./Wrapped.styles";

export type BarDatum = {
  label: string;
  value: number;
  accent?: string;
  highlight?: boolean;
};

type Props = {
  data: BarDatum[];
  accent?: string;
  highlightAccent?: string;
  showValues?: boolean;
};

// A dependency-free SVG-less bar chart. Bars grow from 0 -> their height when
// the chart scrolls into view, staggered left-to-right via framer-motion.
function BarChart({ data, accent, highlightAccent, showValues }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <ChartWrap ref={ref}>
      <Bars style={{ "--bar-count": data.length } as CSSProperties}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const barAccent = d.highlight ? highlightAccent || accent : d.accent || accent;
          return (
            <BarColumn key={`${d.label}-${i}`}>
              {showValues && (
                <BarValueSlot>
                  <BarValue>{d.value}</BarValue>
                </BarValueSlot>
              )}
              <BarTrack>
                <Bar
                  style={{ background: barAccent }}
                  initial={{ height: 0 }}
                  animate={inView ? { height: `${pct}%` } : { height: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.04, ease: "easeOut" }}
                />
              </BarTrack>
              <BarLabel>{d.label}</BarLabel>
            </BarColumn>
          );
        })}
      </Bars>
    </ChartWrap>
  );
}

export default BarChart;
