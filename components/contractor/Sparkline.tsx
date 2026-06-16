import { cn } from "@/lib/cn";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  /** Tailwind text-* class sets the stroke colour (currentColor). */
  className?: string;
}

/** Minimal hand-built trend line (no chart lib). Colour comes from currentColor. */
export function Sparkline({ values, width = 132, height = 36, className }: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={cn("text-hint", className)} aria-hidden>
        <line x1="2" y1={height / 2} x2={width - 2} y2={height / 2} stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)} ${height - pad} L${points[0][0].toFixed(1)} ${height - pad} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("text-brand-500", className)} aria-hidden fill="none">
      <path d={area} className="fill-current opacity-[0.08]" stroke="none" />
      <path d={line} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.4" className="fill-current" />
    </svg>
  );
}
