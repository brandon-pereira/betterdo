import { styled } from "@linaria/react";
import { m } from "framer-motion";

import { theme } from "../../theme";

// Occupies the same grid cell the Body/task list uses, so the sidebar, logo
// and header stay in place around it. Scrolls internally.
export const Page = styled.div`
  grid-row: 4;
  grid-column: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: ${theme.colors.body.background};
  color: ${theme.colors.body.color};
  ${theme.queries.medium} {
    grid-row: 2;
    grid-column: 2;
  }
`;

export const Dashboard = styled.div`
  padding: 1rem;
  max-width: 60rem;
  margin: 0 auto;
  ${theme.queries.medium} {
    padding: 1.5rem;
  }
`;

export const Intro = styled.div`
  margin-bottom: 1.25rem;
`;

export const IntroTitle = styled.h1`
  margin: 0;
  font-size: clamp(1.6rem, 5vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.02em;
`;

export const IntroSub = styled.p`
  margin: 0.35rem 0 0;
  opacity: 0.7;
  font-size: 1rem;
`;

// ---- Period picker (Month / Year / All time + previous/next) ----

export const PeriodBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

export const PeriodTabs = styled.div`
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 999px;
  background: ${theme.effects.tintMedium};
`;

export const PeriodTab = styled.button`
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  &[aria-pressed="true"] {
    background: ${theme.colors.general.blue};
    color: #fff;
    cursor: default;
  }
`;

export const PeriodStepper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

export const PeriodLabel = styled.span`
  min-width: 8.5rem;
  text-align: center;
  font-weight: 700;
`;

export const StepButton = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: ${theme.effects.tintMedium};
  color: inherit;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover:not(:disabled) {
    background: ${theme.effects.tintActive};
  }
  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

// Responsive masonry-ish grid. Cards can opt into spanning 2 columns.
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
  ${theme.queries.medium} {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
`;

// Gradient cards set --card-background and data-gradient; wide cards set data-span.
export const Card = styled(m.div)`
  grid-column: span 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem 1.2rem;
  border-radius: 1rem;
  color: inherit;
  background: var(--card-background, ${theme.colors.modals.contentBackground});
  box-shadow: ${theme.colors.task.boxShadow};
  overflow: hidden;
  &[data-gradient="true"] {
    color: #fff;
  }
  &[data-span="2"] {
    grid-column: span 2;
  }
  ${theme.queries.medium} {
    grid-column: span 2;
    padding: 1.25rem 1.4rem;
    &[data-span="2"] {
      grid-column: span 4;
    }
  }
`;

export const CardLabel = styled.p`
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.65;
`;

export const BigStat = styled.div`
  font-size: clamp(2.25rem, 9vw, 3.25rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
`;

export const CardNote = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.85;
  strong {
    font-weight: 800;
    opacity: 1;
  }
`;

// ---- First task ("origin story") tile ----

export const FirstTask = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.25rem;
`;

// Oversized decorative opening quote behind the title.
export const QuoteMark = styled.span`
  position: absolute;
  top: -1.75rem;
  left: -0.5rem;
  font-size: 5rem;
  line-height: 1;
  font-weight: 800;
  font-family: Georgia, "Times New Roman", serif;
  opacity: 0.15;
  pointer-events: none;
  user-select: none;
`;

export const FirstTaskTitle = styled.p`
  position: relative;
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1.5rem, 6vw, 2.1rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
`;

export const FirstTaskMeta = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
`;

export const FirstTaskDate = styled.span`
  font-weight: 700;
`;

export const FirstTaskAgo = styled.span`
  opacity: 0.7;
`;

// ---- Charts ----

export const ChartWrap = styled.div`
  width: 100%;
`;

// Column count comes from --bar-count.
export const Bars = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--bar-count, 12), 1fr);
  align-items: stretch;
  gap: 0.3rem;
  width: 100%;
  height: 9rem;
`;

export const BarColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  height: 100%;
  min-height: 0;
`;

// The value label sits above the bar; fixed height so every column reserves the
// same space and bar percentages compare fairly.
export const BarValueSlot = styled.div`
  height: 0.85rem;
  display: flex;
  align-items: flex-end;
`;

// The track that the bar grows within. It flexes to fill the remaining column
// height (after value + label), so a bar's % height is measured against a
// consistent area for every column.
export const BarTrack = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

export const Bar = styled(m.div)`
  width: 100%;
  border-radius: 0.25rem 0.25rem 0 0;
  background: currentColor;
  min-height: 0.15rem;
`;

export const BarLabel = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  opacity: 0.6;
  white-space: nowrap;
`;

export const BarValue = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
`;

// ---- Area chart (hour-of-day distribution) ----

export const AreaChartBox = styled(m.div)`
  position: relative;
  width: 100%;
  height: 8rem;
`;

export const AreaSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const AreaFill = styled.path`
  opacity: 0.18;
`;

export const AreaLine = styled.path`
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
`;

// An absolutely-positioned HTML dot so it stays a perfect small circle
// regardless of the SVG's non-uniform (stretched) scaling.
export const AreaDot = styled.span`
  position: absolute;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

export const AreaAxis = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.4rem;
  font-size: 0.6rem;
  font-weight: 600;
  opacity: 0.55;
`;

export const AreaPeak = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.85;
  strong {
    font-weight: 800;
    opacity: 1;
  }
`;

// ---- Ranked lists (top tasks / lists) ----

export const RankList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

export const RankRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.6rem;
  background: rgba(128, 128, 128, 0.12);
  text-align: left;
`;

export const RankNumber = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  opacity: 0.55;
  min-width: 1.2rem;
`;

export const RankDot = styled.span`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--dot-color);
  box-shadow: 0 0 0 2px rgba(128, 128, 128, 0.3);
`;

export const RankTitle = styled.span`
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RankCount = styled.span`
  font-weight: 800;
  font-size: 0.95rem;
`;

export const BackButton = styled.button`
  margin-top: 1rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: ${theme.colors.general.blue};
  transition: filter 0.2s ease;
  &:hover {
    filter: brightness(1.1);
  }
`;

export const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
`;

export const CenteredTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
`;
