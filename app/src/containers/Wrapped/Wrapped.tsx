import { useMemo } from "react";
import type { CSSProperties } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import {
  Page,
  Dashboard,
  Intro,
  IntroTitle,
  IntroSub,
  PeriodBar,
  PeriodTabs,
  PeriodTab,
  PeriodStepper,
  PeriodLabel,
  StepButton,
  Grid,
  Card,
  CardLabel,
  BigStat,
  CardNote,
  FirstTask,
  QuoteMark,
  FirstTaskTitle,
  FirstTaskMeta,
  FirstTaskDate,
  FirstTaskAgo,
  RankList,
  RankRow,
  RankNumber,
  RankDot,
  RankTitle,
  RankCount,
  BackButton,
  Centered,
  CenteredTitle
} from "./Wrapped.styles";
import BarChart, { type BarDatum } from "./BarChart";
import AreaChart from "./AreaChart";
import CountUp from "./CountUp";
import WrappedHeader from "./WrappedHeader";

import Container from "../Container";
import Logo from "../Logo";
import Navigation from "../Navigation";
import Helmet from "@components/Helmet";
import useWrapped from "@hooks/useWrapped";
import useProfile from "@hooks/useProfile";
import Loader from "@components/Loader";
import formatNumber from "@utilities/formatNumber";
import {
  formatPeriod,
  getCurrentPeriodKey,
  getPeriodStart,
  parsePeriodKey,
  shiftPeriodKey,
  toPeriodKey,
  type WrappedPeriodType
} from "@utilities/wrappedPeriod";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const GRAD_BLUE = "linear-gradient(145deg, #2979ff, #6a11cb)";
const GRAD_GREEN = "linear-gradient(145deg, #11998e, #38ef7d)";
const GRAD_PINK = "linear-gradient(145deg, #f5576c, #f093fb)";
const GRAD_ORANGE = "linear-gradient(145deg, #ff6a00, #ee0979)";
const GRAD_PURPLE = "linear-gradient(145deg, #7028e4, #e5b2ca)";
const GRAD_TEAL = "linear-gradient(145deg, #0093e9, #80d0c7)";

const PERIOD_TABS: { type: WrappedPeriodType; label: string }[] = [
  { type: "month", label: "Month" },
  { type: "year", label: "Year" },
  { type: "all-time", label: "All time" }
];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: i * 0.05 }
  })
} as const;

const gradientCard = (gradient: string) => ({
  "data-gradient": "true",
  style: { "--card-background": gradient } as CSSProperties
});

// Format a date. The year is included unless `contextYear` is provided and the
// date falls within it (in a single-year view the year is implied by context).
function formatDate(iso: string | null, contextYear?: number): string {
  if (!iso) return "";
  // Date-only strings ("2026-10-22") would otherwise parse as UTC midnight,
  // which is the previous day in timezones west of UTC.
  const d = new Date(iso.length === 10 ? `${iso}T00:00` : iso.replace(" ", "T"));
  const showYear = contextYear === undefined || d.getFullYear() !== contextYear;
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {})
  });
}

function timeAgo(iso: string): string {
  const then = new Date(iso.replace(" ", "T")).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} ago`;
  return "today";
}

// Switching tabs keeps you near the period you were looking at.
function getTabPeriodKey(type: WrappedPeriodType, currentKey: string) {
  const current = parsePeriodKey(currentKey);
  const now = new Date();
  if (type === "all-time" || !current || current.type === "all-time") {
    return getCurrentPeriodKey(type);
  }
  if (type === "year") {
    return String(current.year);
  }
  // Year -> month: the current month for this year, otherwise that year's December.
  return current.year === now.getFullYear() ? getCurrentPeriodKey("month") : `${current.year}-12`;
}

function Wrapped() {
  const navigate = useNavigate();
  const { period: periodParam } = useParams();
  const parsedPeriod = parsePeriodKey(periodParam);

  if (!parsedPeriod) {
    return <Navigate to={`/wrapped/${getCurrentPeriodKey()}`} replace />;
  }

  return (
    <Chrome>
      <Recap periodKey={toPeriodKey(parsedPeriod)} onSelectPeriod={key => navigate(`/wrapped/${key}`)} />
    </Chrome>
  );
}

interface RecapProps {
  periodKey: string;
  onSelectPeriod: (periodKey: string) => void;
}

function Recap({ periodKey, onSelectPeriod }: RecapProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { data, loading, error } = useWrapped(periodKey);
  const period = parsePeriodKey(periodKey)!;
  const isAllTime = period.type === "all-time";
  const isMonth = period.type === "month";
  const periodNoun = isMonth ? "month" : "year";

  // Page between the account's first period and the current one.
  const previousKey = shiftPeriodKey(periodKey, -1);
  const nextKey = shiftPeriodKey(periodKey, 1);
  const previousStart = getPeriodStart(previousKey);
  const nextStart = getPeriodStart(nextKey);
  const creationDate = profile?.creationDate ? new Date(profile.creationDate) : null;
  const creationStart = creationDate
    ? getPeriodStart(
        toPeriodKey({ type: period.type, year: creationDate.getFullYear(), month: creationDate.getMonth() + 1 })
      )
    : null;
  const canGoPrevious = !isAllTime && Boolean(previousStart && (!creationStart || previousStart >= creationStart));
  const canGoNext = !isAllTime && Boolean(nextStart && nextStart <= new Date());
  const isCurrentPeriod = !isAllTime && !canGoNext;

  const breakdownData: BarDatum[] = useMemo(
    () =>
      (data?.breakdown ?? []).map(b => {
        let label = b.label;
        if (data?.periodType === "month") {
          // Thirty-odd columns only have room for a few day labels.
          label = b.key === 1 || b.key % 5 === 0 ? b.label : "";
        } else if (data?.periodType === "year") {
          label = b.label.charAt(0);
        }
        return { label, value: b.completed };
      }),
    [data]
  );

  const weekdayData: (BarDatum & { name: string })[] = useMemo(() => {
    const rows = data?.byWeekday ?? [];
    const byIndex = new Map(rows.map(r => [r.weekday, r.count]));
    const max = Math.max(0, ...rows.map(r => r.count));
    return WEEKDAY_LABELS.map((label, i) => ({
      label,
      name: WEEKDAY_NAMES[i],
      value: byIndex.get(i) ?? 0,
      highlight: (byIndex.get(i) ?? 0) === max && max > 0
    }));
  }, [data]);

  const hourValues: number[] = useMemo(() => {
    const rows = data?.byHour ?? [];
    const byIndex = new Map(rows.map(r => [r.hour, r.count]));
    return Array.from({ length: 24 }, (_, h) => byIndex.get(h) ?? 0);
  }, [data]);

  const periodBar = (
    <PeriodBar>
      <PeriodTabs role="group" aria-label="Recap period">
        {PERIOD_TABS.map(tab => (
          <PeriodTab
            key={tab.type}
            aria-pressed={period.type === tab.type}
            onClick={() => period.type !== tab.type && onSelectPeriod(getTabPeriodKey(tab.type, periodKey))}
          >
            {tab.label}
          </PeriodTab>
        ))}
      </PeriodTabs>
      {!isAllTime && (
        <PeriodStepper>
          <StepButton
            aria-label={`Previous ${periodNoun}`}
            disabled={!canGoPrevious}
            onClick={() => onSelectPeriod(previousKey)}
          >
            ‹
          </StepButton>
          <PeriodLabel>{formatPeriod(periodKey)}</PeriodLabel>
          <StepButton aria-label={`Next ${periodNoun}`} disabled={!canGoNext} onClick={() => onSelectPeriod(nextKey)}>
            ›
          </StepButton>
        </PeriodStepper>
      )}
    </PeriodBar>
  );

  if (loading) {
    return (
      <Page>
        <Dashboard>
          {periodBar}
          <Centered>
            <Loader isVisible size="3rem" />
          </Centered>
        </Dashboard>
      </Page>
    );
  }

  if (error || !data || data.totals.created + data.totals.completed === 0) {
    return (
      <Page>
        <Dashboard>
          {periodBar}
          <Centered>
            <CenteredTitle>Nothing to recap yet</CenteredTitle>
            <CardNote>
              {error
                ? "We couldn't load your recap. Try again in a bit."
                : `No tasks were added or completed in ${isAllTime ? "your account" : formatPeriod(periodKey)}.`}
            </CardNote>
            <BackButton onClick={() => navigate("/")}>Back to BetterDo</BackButton>
          </Centered>
        </Dashboard>
      </Page>
    );
  }

  const { totals, longestStreak, busiestDay, topTasks, topLists, firstTask } = data;
  const streak = longestStreak.completed;
  const peakWeekday = weekdayData.reduce((a, b) => (b.value > a.value ? b : a), weekdayData[0]);

  // Within a month or year, dates in that year can omit it.
  const contextYear = isAllTime ? undefined : data.year;
  const periodName = isAllTime ? "all-time" : formatPeriod(periodKey);
  const monthName = isMonth
    ? new Date(period.year, period.month - 1, 1).toLocaleDateString(undefined, { month: "long" })
    : "";

  let introSub = "Everything you've ever gotten done, at a glance.";
  if (!isAllTime) {
    introSub = isCurrentPeriod
      ? `Everything you've gotten done so far this ${periodNoun}.`
      : `Everything you got done this ${periodNoun}, at a glance.`;
  }

  // Staggers the cards' fade-in.
  let i = 0;
  const anim = () => ({
    custom: i++,
    variants: cardVariants,
    initial: "hidden" as const,
    animate: "visible" as const
  });

  return (
    <Page>
      <Dashboard>
        {periodBar}
        <Intro>
          <IntroTitle>
            {profile?.firstName ? `${profile.firstName}, your ` : "Your "}
            {periodName} Wrapped
          </IntroTitle>
          <IntroSub>{introSub}</IntroSub>
        </Intro>

        <Grid>
          <Card {...anim()} {...gradientCard(GRAD_BLUE)}>
            <CardLabel>Tasks created</CardLabel>
            <BigStat>
              <CountUp value={totals.created} />
            </BigStat>
            <CardNote>
              {totals.growthPct != null && totals.growthPct > 0 ? (
                <>
                  <strong>{Math.round(totals.growthPct)}% more</strong> than last {periodNoun}
                </>
              ) : (
                <>
                  about <strong>{totals.avgPerDay}</strong> a day
                </>
              )}
            </CardNote>
          </Card>

          <Card {...anim()} {...gradientCard(GRAD_GREEN)}>
            <CardLabel>Tasks completed</CardLabel>
            <BigStat>
              <CountUp value={totals.completed} />
            </BigStat>
            <CardNote>
              <strong>{totals.completionRate}%</strong> of new tasks done
            </CardNote>
          </Card>

          <Card {...anim()} {...gradientCard(GRAD_ORANGE)}>
            <CardLabel>Longest streak</CardLabel>
            <BigStat>
              <CountUp value={streak.length} suffix=" 🔥" />
            </BigStat>
            <CardNote>
              {streak.length > 0 ? (
                <>
                  {streak.length === 1 ? "day" : "days in a row"} completing tasks
                  <br />
                  {streak.start === streak.end
                    ? formatDate(streak.start, contextYear)
                    : `${formatDate(streak.start, contextYear)} – ${formatDate(streak.end, contextYear)}`}
                </>
              ) : (
                <>Complete a task every day to start one!</>
              )}
            </CardNote>
          </Card>

          <Card {...anim()} {...gradientCard(GRAD_PINK)}>
            <CardLabel>Most in one day</CardLabel>
            <BigStat>{busiestDay?.count ?? 0}</BigStat>
            <CardNote>
              {busiestDay ? (
                <>
                  tasks created on <strong>{formatDate(busiestDay.date, contextYear)}</strong>
                </>
              ) : (
                "—"
              )}
            </CardNote>
          </Card>

          <Card {...anim()} {...gradientCard(GRAD_PURPLE)}>
            <CardLabel>Active days</CardLabel>
            <BigStat>
              <CountUp value={totals.activeDays} />
            </BigStat>
            <CardNote>
              you showed up <strong>{Math.round((totals.activeDays / totals.daysInPeriod) * 100)}%</strong> of{" "}
              {isAllTime ? "the time" : `the ${periodNoun}`}
            </CardNote>
          </Card>

          <Card {...anim()} {...gradientCard(GRAD_TEAL)}>
            <CardLabel>Per active day</CardLabel>
            <BigStat>{totals.avgPerActiveDay}</BigStat>
            <CardNote>tasks on days you were active</CardNote>
          </Card>

          <Card {...anim()} data-span="2">
            <CardLabel>
              {isAllTime ? "Completed by year" : isMonth ? "Completed by day" : "Completed by month"}
            </CardLabel>
            <BarChart data={breakdownData} accent="currentColor" showValues={isAllTime} />
          </Card>

          <Card {...anim()} data-span="2">
            <CardLabel>{peakWeekday?.value ? `${peakWeekday.name}s are your power day` : "By weekday"}</CardLabel>
            <BarChart data={weekdayData} accent="rgba(128,128,128,0.4)" highlightAccent="currentColor" showValues />
          </Card>

          <Card {...anim()} data-span="2">
            <CardLabel>When you plan</CardLabel>
            <AreaChart values={hourValues} />
          </Card>

          {firstTask && (
            <Card {...anim()} data-span="2">
              <CardLabel>
                {isAllTime ? "Where it all began" : `How you kicked off ${isMonth ? monthName : data.year}`}
              </CardLabel>
              <FirstTask>
                <QuoteMark aria-hidden>&ldquo;</QuoteMark>
                <FirstTaskTitle>{firstTask.title}</FirstTaskTitle>
                <FirstTaskMeta>
                  <FirstTaskDate>{formatDate(firstTask.createdAt, contextYear)}</FirstTaskDate>
                  <FirstTaskAgo>
                    · {isAllTime ? "your very first task" : `your first task of the ${periodNoun}`}
                    {isAllTime ? `, ${timeAgo(firstTask.createdAt)}` : ""}
                  </FirstTaskAgo>
                </FirstTaskMeta>
              </FirstTask>
            </Card>
          )}

          {topTasks.length > 0 && (
            <Card {...anim()} data-span="2">
              <CardLabel>Top recurring tasks</CardLabel>
              <RankList>
                {topTasks.slice(0, 5).map((t, idx) => (
                  <RankRow key={t.title}>
                    <RankNumber>{idx + 1}</RankNumber>
                    <RankTitle>{t.title}</RankTitle>
                    <RankCount>{t.count}×</RankCount>
                  </RankRow>
                ))}
              </RankList>
            </Card>
          )}

          {topLists.length > 0 && (
            <Card {...anim()} data-span="2">
              <CardLabel>Busiest lists</CardLabel>
              <RankList>
                {topLists.slice(0, 5).map((l, idx) => (
                  <RankRow key={`${l.title}-${idx}`}>
                    <RankNumber>{idx + 1}</RankNumber>
                    <RankDot style={{ "--dot-color": l.color } as CSSProperties} />
                    <RankTitle>{l.title}</RankTitle>
                    <RankCount>{formatNumber(l.count)}</RankCount>
                  </RankRow>
                ))}
              </RankList>
            </Card>
          )}
        </Grid>
      </Dashboard>
    </Page>
  );
}

// Shared app chrome (sidebar, logo, header) so Wrapped feels in-app. Kept outside
// Recap so the sidebar doesn't remount while paging between periods.
function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Helmet />
      <Container>
        <Logo />
        <Navigation />
        <WrappedHeader />
        {children}
      </Container>
    </>
  );
}

export default Wrapped;
