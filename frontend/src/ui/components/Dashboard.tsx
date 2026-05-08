'use client';

import { useEffect, useRef, useMemo, useState } from "react";
import {
  Chart,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  LineController, BarController, DoughnutController, ArcElement,
  Filler, Tooltip, Legend,
} from "chart.js";

Chart.register(
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, ArcElement,
  LineController, BarController, DoughnutController,
  Filler, Tooltip, Legend
);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface PushData {
  date: string;                              // ISO string
  sha?: string;
  sqale_index: number;                       // minutes
  sqale_debt_ratio?: number;                 // % (0-100)
  ncloc: number;
  bugs: number;
  vulnerabilities: number;
  code_smells: number;
  cognitive_complexity: number;
  coverage?: number;                         // %
  duplicated_lines_density: number;          // %
  reliability_remediation_effort?: number;   // minutes
  security_remediation_effort?: number;      // minutes
  new_technical_debt?: number;               // minutes (pour résolution)
}

interface DashboardProps {
  buffer: PushData[];
  projectName?: string;
  weights?: {          // poids pour la vélocité composite
    quality: number;   // w1
    coverage: number;  // w2
    productivity: number; // w3
    debt: number;      // w4
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (incluant animations)
// ─────────────────────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #08090B; }

  .db {
    min-height: 100vh;
    background: #08090B;
    color: #EAE6DF;
    font-family: 'IBM Plex Mono', monospace;
    padding: 32px;
  }

  /* ── HEADER ── */
  .db-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px; padding-bottom: 20px;
    border-bottom: 1px solid #1C2128;
  }
  .db-header-left { display: flex; align-items: center; gap: 14px; }
  .db-logo-mark {
    width: 32px; height: 32px; border: 1.5px solid #E8A020;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: #E8A020; letter-spacing: 0.05em;
    transition: transform 0.25s ease;
  }
  .db-logo-mark:hover {
    transform: rotate(5deg) scale(1.02);
  }
  .db-site-name {
    font-family: 'DM Serif Display', serif;
    font-size: 18px; color: #EAE6DF; letter-spacing: -0.02em;
  }
  .db-site-name em { font-style: italic; color: #E8A020; }
  .db-project-name {
    font-size: 11px; color: #3D4552; letter-spacing: 0.08em;
    text-transform: uppercase; margin-top: 3px;
    transition: color 0.2s ease;
  }
  .db-project-name:hover { color: #7A8494; }
  .db-status {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: #7A8494; letter-spacing: 0.06em;
  }
  .db-dot-live {
    width: 7px; height: 7px; border-radius: 50%; background: #E8A020;
    animation: pulse-live 2s infinite;
  }
  @keyframes pulse-live { 0%,100%{opacity:1} 50%{opacity:0.2} }

  /* ── KPIs PRINCIPALES ── */
  .db-kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px; margin-bottom: 24px;
  }
  .db-kpi-card {
    background: #0E1115; border: 1px solid #1C2128;
    padding: 20px;
    display: flex; flex-direction: column;
    animation: fadeInUp 0.4s ease-out forwards;
    opacity: 0;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .db-kpi-card:hover {
    transform: translateY(-2px);
    border-color: #E8A020;
    box-shadow: 0 6px 14px rgba(232, 160, 32, 0.08);
  }
  .db-kpi-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 12px;
  }
  .db-kpi-icon {
    font-size: 18px; width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: #1C2128; border-radius: 2px;
  }
  .db-kpi-title {
    font-size: 12px; font-weight: 600; letter-spacing: 0.05em;
    text-transform: uppercase; color: #EAE6DF;
  }
  .db-kpi-value {
    font-size: 28px; font-weight: 600; line-height: 1.2;
  }
  .db-kpi-value.highlight-change {
    animation: softPulse 0.8s ease-out;
  }
  .db-kpi-sub {
    font-size: 11px; color: #7A8494; margin-top: 4px;
    display: flex; align-items: center; gap: 6px;
  }
  .db-kpi-sub span { color: #E8A020; }

  /* ── GRILLES ── */
  .db-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .db-grid-full { grid-column: 1 / -1; }

  /* ── CARTES GRAPHIQUES ── */
  .db-chart-card {
    background: #0E1115; border: 1px solid #1C2128;
    padding: 20px 20px 16px;
    display: flex; flex-direction: column; gap: 12px;
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .db-chart-card:hover {
    border-color: #3D4552;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  .db-chart-header {
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .db-chart-title {
    font-size: 11px; font-weight: 600; color: #EAE6DF;
    letter-spacing: 0.05em; text-transform: uppercase;
  }
  .db-chart-formula {
    font-size: 9px; color: #3D4552; margin-top: 3px; letter-spacing: 0.04em;
  }
  .db-chart-badge {
    font-size: 9px; color: #E8A020; border: 1px solid #9B6910;
    padding: 2px 7px; letter-spacing: 0.08em; white-space: nowrap;
  }
  .db-chart-badge.teal  { color: #2DD4BF; border-color: rgba(45,212,191,0.35); }
  .db-chart-badge.green { color: #639922; border-color: rgba(99,153,34,0.35); }
  .db-chart-badge.red   { color: #E24B4A; border-color: rgba(226,75,74,0.35); }
  .db-chart-badge.blue  { color: #378ADD; border-color: rgba(55,138,221,0.35); }

  .db-chart-wrap {
    position: relative;
    width: 100%;
  }

  /* ── JAUGE ── */
  .db-gauge-container {
    display: flex; align-items: center; gap: 16px;
  }
  .db-gauge-chart {
    width: 120px; height: 120px;
    transition: filter 0.3s ease;
  }
  .db-gauge-chart:hover {
    filter: drop-shadow(0 0 6px currentColor);
  }
  .db-gauge-meta {
    flex: 1;
  }
  .db-gauge-value {
    font-size: 36px; font-weight: 600;
  }
  .db-gauge-threshold {
    font-size: 11px; margin-top: 6px;
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeInUp {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes softPulse {
    0%, 100% { background-color: #0E1115; border-color: #1C2128; }
    50% { background-color: #14181E; border-color: #E8A020; }
  }

  /* Délais en cascade */
  .db-kpis .db-kpi-card:nth-child(1) { animation-delay: 0.05s; }
  .db-kpis .db-kpi-card:nth-child(2) { animation-delay: 0.15s; }
  .db-kpis .db-kpi-card:nth-child(3) { animation-delay: 0.25s; }

  .db-grid .db-chart-card:nth-child(1) { animation-delay: 0.1s; }
  .db-grid .db-chart-card:nth-child(2) { animation-delay: 0.2s; }
  .db-grid .db-chart-card:nth-child(3) { animation-delay: 0.3s; }
  .db-grid .db-chart-card:nth-child(4) { animation-delay: 0.4s; }
  .db-grid .db-chart-card:nth-child(5) { animation-delay: 0.5s; }

  @media (max-width: 900px) {
    .db { padding: 16px; }
    .db-kpis { grid-template-columns: 1fr; }
    .db-grid { grid-template-columns: 1fr; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const CHART_DEFAULTS = {
  gridColor:   "rgba(255,255,255,0.05)",
  tickColor:   "#3D4552",
  tooltipBg:   "#0E1115",
  tooltipBorder: "#262D36",
  fontMono:    "'IBM Plex Mono', monospace",
};

function baseOptions(yLabel = "", extraY = {}): object {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: CHART_DEFAULTS.tooltipBg,
        borderColor:     CHART_DEFAULTS.tooltipBorder,
        borderWidth:     1,
        titleColor:      "#7A8494",
        bodyColor:       "#EAE6DF",
        titleFont:       { family: CHART_DEFAULTS.fontMono, size: 10 },
        bodyFont:        { family: CHART_DEFAULTS.fontMono, size: 11 },
        padding:         10,
        cornerRadius:    0,
      },
    },
    scales: {
      x: {
        ticks: {
          color:    CHART_DEFAULTS.tickColor,
          font:     { family: CHART_DEFAULTS.fontMono, size: 9 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: { color: CHART_DEFAULTS.gridColor },
      },
      y: {
        ticks: {
          color:  CHART_DEFAULTS.tickColor,
          font:   { family: CHART_DEFAULTS.fontMono, size: 9 },
          ...( yLabel ? { callback: (v: number) => `${v.toFixed(1)}${yLabel}` } : {} ),
        },
        grid:  { color: CHART_DEFAULTS.gridColor },
        ...extraY,
      },
    },
  };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

function hoursBetween(d1: string, d2: string): number {
  return (new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60);
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK pour Chart.js
// ─────────────────────────────────────────────────────────────────────────────

function useChart(
  factory: (canvas: HTMLCanvasElement) => Chart
): React.RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = factory(canvasRef.current);
    return () => { chartRef.current?.destroy(); };
  });

  return canvasRef;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS INTERNES
// ─────────────────────────────────────────────────────────────────────────────

function TopKpiCard({
  icon, title, value, unit, subLabel, subValue
}: {
  icon: string; title: string; value: string | number; unit?: string;
  subLabel: string; subValue: string | number;
}) {
  const [highlight, setHighlight] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setHighlight(true);
      const timer = setTimeout(() => setHighlight(false), 800);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="db-kpi-card">
      <div className="db-kpi-header">
        <div className="db-kpi-icon">{icon}</div>
        <div className="db-kpi-title">{title}</div>
      </div>
      <div className={`db-kpi-value ${highlight ? 'highlight-change' : ''}`}>
        {value}{unit && <span style={{fontSize: 14, marginLeft: 4, color: '#7A8494'}}>{unit}</span>}
      </div>
      <div className="db-kpi-sub">
        {subLabel} <span>{subValue}</span>
      </div>
    </div>
  );
}

function ChartCard({
  title, formula, badge, badgeColor = "amber", height = 200, children,
}: {
  title: string; formula?: string; badge?: string; badgeColor?: string;
  height?: number; children: React.ReactNode;
}) {
  return (
    <div className="db-chart-card">
      <div className="db-chart-header">
        <div>
          <div className="db-chart-title">{title}</div>
          {formula && <div className="db-chart-formula">{formula}</div>}
        </div>
        {badge && <div className={`db-chart-badge ${badgeColor}`}>{badge}</div>}
      </div>
      <div className="db-chart-wrap" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard({ buffer, projectName, weights }: DashboardProps) {
  // Poids par défaut pour la vélocité composite
  const w = useMemo(() => weights ?? {
    quality: 0.35,
    coverage: 0.30,
    productivity: 0.25,
    debt: 0.10,
  }, [weights]);

  // Calculs dérivés
  const metrics = useMemo(() => {
    if (buffer.length === 0) return null;

    const labels = buffer.map(d => fmtDate(d.date));
    const last = buffer[buffer.length - 1];
    const prev = buffer.length > 1 ? buffer[buffer.length - 2] : null;

    // Dette en jours
    const debtDays = buffer.map(d => d.sqale_index / 480);

    // Squale Debt Ratio (si absent, estimation)
    const sqaleRatio = buffer.map(d => {
      if (d.sqale_debt_ratio !== undefined) return d.sqale_debt_ratio;
      return d.ncloc > 0 ? (d.sqale_index / d.ncloc) * 100 : 0;
    });

    // Vélocité composite V(t)
    const compositeVelocity: number[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const d = buffer[i];
      const q = 1 - (d.bugs + d.vulnerabilities + d.code_smells) / (d.ncloc || 1) * 1000;
      const c = (d.coverage ?? 0) / 100;
      let p = 0;
      if (i > 0) {
        const deltaLoc = d.ncloc - buffer[i-1].ncloc;
        const deltaHours = hoursBetween(buffer[i-1].date, d.date);
        p = deltaHours > 0 ? deltaLoc / deltaHours : 0;
      }
      const debtFactor = (d.sqale_debt_ratio ?? 0) / 100;
      const V = w.quality * q + w.coverage * c + w.productivity * p - w.debt * debtFactor;
      compositeVelocity.push(V);
    }

    // Dérivée discrète de V (dV/dt)
    const velocityDerivative: number[] = [0];
    for (let i = 1; i < buffer.length; i++) {
      const deltaV = compositeVelocity[i] - compositeVelocity[i-1];
      const deltaHours = hoursBetween(buffer[i-1].date, buffer[i].date);
      velocityDerivative.push(deltaHours > 0 ? deltaV / deltaHours : 0);
    }

    // Résolution de la dette : Res = (D(t-1)-D(t) + new_debt) / D(t-1)
    const resolution: number[] = [0];
    for (let i = 1; i < buffer.length; i++) {
      const prevDebt = buffer[i-1].sqale_index;
      const currDebt = buffer[i].sqale_index;
      const newDebt = buffer[i].new_technical_debt ?? 0;
      if (prevDebt > 0) {
        resolution.push(((prevDebt - currDebt + newDebt) / prevDebt) * 100);
      } else {
        resolution.push(0);
      }
    }

    return {
      labels,
      debtDays,
      sqaleRatio,
      compositeVelocity,
      velocityDerivative,
      resolution,
      last,
      prev,
      cogComplex: buffer.map(d => d.cognitive_complexity),
      coverage: buffer.map(d => d.coverage ?? 0),
      duplic: buffer.map(d => d.duplicated_lines_density),
      defects: buffer.map(d => d.bugs + d.vulnerabilities),
    };
  }, [buffer, w]);

  if (!metrics) return null;

  const { labels, debtDays, sqaleRatio, velocityDerivative, resolution, last, prev } = metrics;
  const currentSqaleRatio = sqaleRatio[sqaleRatio.length - 1] ?? 0;
  const gaugeColor = currentSqaleRatio < 5 ? '#2DD4BF' : currentSqaleRatio < 10 ? '#E8A020' : '#E24B4A';

  // ── GRAPHIQUES ─────────────────────────────────────────────────────────────

  // 1. Dette technique (aire)
  const chartDebt = useChart(canvas => new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: debtDays,
        borderColor: '#E8A020',
        backgroundColor: 'rgba(232,160,32,0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
        pointBackgroundColor: '#E8A020',
      }]
    },
    options: {
      ...baseOptions('j'),
      plugins: {
        ...(baseOptions('j') as any).plugins,
        tooltip: {
          ...(baseOptions('j') as any).plugins.tooltip,
          callbacks: { label: (c: any) => `  ${c.parsed.y.toFixed(2)} jours` }
        }
      }
    } as any
  }));

  // 2. Jauge Squale Debt Ratio
  const gaugeChart = useChart(canvas => {
    const value = Math.min(currentSqaleRatio, 100);
    const remaining = 100 - value;
    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value, remaining],
          backgroundColor: [gaugeColor, '#1C2128'],
          borderWidth: 0,
          borderRadius: value > 0 ? 4 : 0,
        }],
        labels: ['Ratio', 'Restant'],
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      }
    });
  });

  // 3. Vélocité d'équipe (dérivée)
  const chartVelocity = useChart(canvas => new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: velocityDerivative,
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        borderWidth: 2,
      }]
    },
    options: {
      ...baseOptions('/h'),
      plugins: {
        ...(baseOptions('/h') as any).plugins,
        tooltip: {
          ...(baseOptions('/h') as any).plugins.tooltip,
          callbacks: { label: (c: any) => `  ${c.parsed.y.toFixed(3)} h⁻¹` }
        }
      }
    } as any
  }));

  // 4. Résolution de la dette (barres)
  const chartResolution = useChart(canvas => new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: resolution,
        backgroundColor: resolution.map(v => v >= 0 ? 'rgba(45,212,191,0.7)' : 'rgba(226,75,74,0.7)'),
        borderRadius: 2,
      }]
    },
    options: {
      ...baseOptions('%'),
      plugins: {
        ...(baseOptions('%') as any).plugins,
        tooltip: {
          ...(baseOptions('%') as any).plugins.tooltip,
          callbacks: { label: (c: any) => `  ${c.parsed.y.toFixed(1)}%` }
        }
      }
    } as any
  }));

  // 5. Complexité cognitive
  const chartCog = useChart(canvas => new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: metrics.cogComplex,
        borderColor: '#378ADD',
        backgroundColor: 'rgba(55,138,221,0.07)',
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        borderWidth: 2,
      }]
    },
    options: baseOptions('') as any
  }));

  // 6. Couverture de tests
  const chartCov = useChart(canvas => new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: metrics.coverage,
        borderColor: '#639922',
        backgroundColor: 'rgba(99,153,34,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        borderWidth: 2,
      }]
    },
    options: {
      ...baseOptions('%'),
      scales: {
        ...(baseOptions('%') as any).scales,
        y: { ...(baseOptions('%') as any).scales.y, min: 0, max: 100 }
      }
    } as any
  }));

  // 7. Duplications
  const chartDuplic = useChart(canvas => new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: metrics.duplic,
        backgroundColor: metrics.duplic.map(v =>
          v > 15 ? 'rgba(226,75,74,0.7)' : v > 8 ? 'rgba(232,160,32,0.7)' : 'rgba(99,153,34,0.7)'
        ),
        borderRadius: 2,
      }]
    },
    options: baseOptions('%') as any
  }));

  return (
    <>
      <style>{styles}</style>
      <div className="db">

        {/* HEADER */}
        <div className="db-header">
          <div className="db-header-left">
            <div className="db-logo-mark">TDI</div>
            <div>
              <div className="db-site-name">
                Technical<em>Debt</em>Inspector
              </div>
              <div className="db-project-name">
                {projectName ?? "—"} · {buffer.length} pushs analysés
              </div>
            </div>
          </div>
          <div className="db-status">
            <div className="db-dot-live" />
            Dernier push {fmtDate(last.date)}
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="db-kpis">
          <TopKpiCard
            icon="🐞"
            title="Bugs & fiabilité"
            value={last.bugs}
            unit=" bugs"
            subLabel="Effort remédiation"
            subValue={`${last.reliability_remediation_effort?.toFixed(0) ?? '—'} min`}
          />
          <TopKpiCard
            icon="🧹"
            title="Code smells & SQALE"
            value={last.code_smells}
            unit=" smells"
            subLabel="Indice SQALE"
            subValue={`${last.sqale_index.toFixed(0)} min`}
          />
          <TopKpiCard
            icon="🛡️"
            title="Vulnérabilités & sécurité"
            value={last.vulnerabilities}
            unit=" vuln."
            subLabel="Effort remédiation"
            subValue={`${last.security_remediation_effort?.toFixed(0) ?? '—'} min`}
          />
        </div>

        {/* GRILLE PRINCIPALE */}
        <div className="db-grid">

          {/* Dette technique (pleine largeur) */}
          <div className="db-grid-full">
            <ChartCard
              title="Dette technique Σ(t)"
              formula="sqale_index(t) / 480  [jours-homme]"
              badge="DETTE · JOURS"
              height={200}
            >
              <canvas ref={chartDebt} />
            </ChartCard>
          </div>

          {/* Jauge Squale Debt Ratio */}
          <ChartCard
            title="Squale Debt Ratio"
            formula="Ratio d'endettement technique"
            badge={`${currentSqaleRatio.toFixed(1)}%`}
            badgeColor={currentSqaleRatio < 5 ? 'green' : currentSqaleRatio < 10 ? 'amber' : 'red'}
            height={180}
          >
            <div className="db-gauge-container">
              <div className="db-gauge-chart">
                <canvas ref={gaugeChart} />
              </div>
              <div className="db-gauge-meta">
                <div className="db-gauge-value" style={{color: gaugeColor}}>
                  {currentSqaleRatio.toFixed(1)}%
                </div>
                <div className="db-gauge-threshold">
                  Seuils : &lt;5% vert · 5-10% jaune · ≥10% rouge
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Vélocité d'équipe */}
          <ChartCard
            title="Vélocité d'équipe (dérivée)"
            formula={`V(t) = ${w.quality}·Q + ${w.coverage}·C + ${w.productivity}·P - ${w.debt}·D`}
            badge="dV/dt"
            badgeColor="blue"
            height={180}
          >
            <canvas ref={chartVelocity} />
          </ChartCard>

          {/* Résolution de la dette */}
          <div className="db-grid-full">
            <ChartCard
              title="Résolution de la dette technique"
              formula="(D(t-1) - D(t) + new_debt) / D(t-1)  [%]"
              badge="RÉSOLUTION"
              height={160}
            >
              <canvas ref={chartResolution} />
            </ChartCard>
          </div>

          {/* Complexité cognitive */}
          <ChartCard title="Complexité cognitive" badge="COMPLEXITÉ" badgeColor="blue" height={160}>
            <canvas ref={chartCog} />
          </ChartCard>

          {/* Couverture de tests */}
          <ChartCard title="Couverture de tests" badge="TESTS" badgeColor="green" height={160}>
            <canvas ref={chartCov} />
          </ChartCard>

          {/* Duplications */}
          <div className="db-grid-full">
            <ChartCard
              title="Densité de code dupliqué"
              formula="duplicated_lines_density(t)  [%]"
              badge="DUPLICATIONS"
              height={150}
            >
              <canvas ref={chartDuplic} />
            </ChartCard>
          </div>

        </div>
      </div>
    </>
  );
}