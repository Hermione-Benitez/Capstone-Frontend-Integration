import React, { useId } from 'react';

export type StatusCardVariant = 'teal' | 'success' | 'warning' | 'danger' | 'info' | 'new' | 'delivery';

export interface StatusCardProps {
  label: string;
  value: string | number;
  icon?: string; // Tabler icon class name, e.g., 'ti ti-truck'
  variant?: StatusCardVariant;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  periodText?: string;
  sparklineData?: number[];
  polarity?: 'higher-is-better' | 'lower-is-better';
  loading?: boolean;
  onClick?: () => void;
}

const variantColors: Record<StatusCardVariant, { accent: string; bg: string }> = {
  teal: { accent: 'var(--teal)', bg: 'var(--teal-bg)' },
  success: { accent: 'var(--ok)', bg: 'var(--ok-bg)' },
  warning: { accent: 'var(--warn)', bg: 'var(--warn-bg)' },
  danger: { accent: 'var(--err)', bg: 'var(--err-bg)' },
  info: { accent: 'var(--info)', bg: 'var(--info-bg)' },
  new: { accent: 'var(--new)', bg: 'var(--new-bg)' },
  delivery: { accent: 'var(--delivery)', bg: 'var(--delivery-bg)' },
};

// ── SVG Sparkline ──────────────────────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  accentVar: string;
  gradientId: string;
  clipId: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, accentVar, gradientId, clipId }) => {
  const W = 120;
  const H = 36;
  const PAD = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [x, y] as [number, number];
  });

  // Smooth cubic bezier path
  const linePath = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = points[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1][0]},${H} L ${points[0][0]},${H} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="kpi-spark-svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentVar} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accentVar} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={W} height={H} className="kpi-spark-clip" />
        </clipPath>
      </defs>

      {/* Gradient area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} className="kpi-spark-area" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={accentVar}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="kpi-spark-line"
        clipPath={`url(#${clipId})`}
      />

      {/* Last-point dot */}
      <circle cx={lastX} cy={lastY} r="2.5" fill={accentVar} className="kpi-spark-dot" />
      {/* Pulse ring */}
      <circle
        cx={lastX}
        cy={lastY}
        r="2.5"
        fill="none"
        stroke={accentVar}
        strokeWidth="1.5"
        className="kpi-spark-pulse"
      />
    </svg>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  value,
  icon,
  variant = 'teal',
  trend,
  periodText,
  sparklineData,
  polarity = 'higher-is-better',
  loading = false,
  onClick,
}) => {
  const uid = useId();
  const gradientId = `spark-grad-${uid.replace(/:/g, '')}`;
  const clipId = `spark-clip-${uid.replace(/:/g, '')}`;

  const colors = variantColors[variant] || variantColors.teal;

  const customStyles = {
    '--kpi-ac': colors.accent,
    '--kpi-ibg': colors.bg,
    '--kpi-ic': colors.accent,
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
  } as React.CSSProperties;

  const getTrendClass = (type: 'up' | 'down' | 'neutral') => {
    if (type === 'neutral') return 't-nl';
    if (polarity === 'lower-is-better') {
      return type === 'down' ? 't-up' : 't-dn';
    } else {
      return type === 'up' ? 't-up' : 't-dn';
    }
  };

  const getTrendIcon = (type: 'up' | 'down' | 'neutral') => {
    if (type === 'up') return '↑';
    if (type === 'down') return '↓';
    return '•';
  };

  if (loading) {
    return (
      <div className="kpi" style={{ ...customStyles, pointerEvents: 'none' }}>
        <div className="kpi-top">
          <div className="kpi-shimmer-bg" style={{ width: '55%', height: '12px' }} />
          <div className="kpi-shimmer-bg kpi-skeleton-circle" style={{ width: '32px', height: '32px' }} />
        </div>
        <div className="kpi-shimmer-bg" style={{ width: '75%', height: '28px', margin: '6px 0 12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: 'auto' }}>
          <div className="kpi-shimmer-bg" style={{ width: '30%', height: '10px' }} />
          <div className="kpi-shimmer-bg" style={{ width: '40%', height: '10px' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`kpi ${onClick ? 'kpi-clickable' : ''}`}
      style={customStyles}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon && (
          <div className="kpi-icon-box">
            <i className={icon} style={{ fontSize: '18px' }} />
          </div>
        )}
      </div>

      <div className="kpi-val">{value}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
        {trend && (
          <div className={`kpi-trend ${getTrendClass(trend.type)}`}>
            <span>{getTrendIcon(trend.type)} {trend.value}</span>
          </div>
        )}
        {periodText && (
          <span className="kpi-period">{periodText}</span>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <div className="kpi-spark">
          <Sparkline
            data={sparklineData}
            accentVar={colors.accent}
            gradientId={gradientId}
            clipId={clipId}
          />
        </div>
      )}
    </div>
  );
};

export default StatusCard;
