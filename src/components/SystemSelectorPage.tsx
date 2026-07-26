/**
 * SystemSelectorPage.tsx — Speedex OneUI
 * Post-login admin landing page for selecting a system (DMS, STARS, FOMS).
 * Used as a guide for FE integration — sidebar/topbar not rendered here.
 */
import React, { useState } from 'react';
import './SystemSelectorPage.css';

/* ── System Registry ─────────────────────────────────────────────── */

export type SystemKey = 'dms' | 'stars' | 'foms';

export interface SpeedexSystem {
  key: SystemKey;
  name: string;       // Short abbreviation shown on the card
  fullName: string;   // Full system name shown below abbreviation
  description: string;
  icon: string;       // Tabler icon class e.g. 'ti ti-truck'
  accentColor: string;
  accentBg: string;
  stats: { label: string; value: string }[];
}

/** Canonical list of Speedex systems — import this anywhere the list is needed */
export const SPEEDEX_SYSTEMS: SpeedexSystem[] = [
  {
    key: 'dms',
    name: 'DMS',
    fullName: 'Delivery Management System',
    description: 'Handles delivery operations, waybill management, and courier dispatch workflows.',
    icon: 'ti ti-truck',
    accentColor: '#00A99D',
    accentBg: 'rgba(0, 169, 157, 0.1)',
    stats: [
      { label: 'Orders Today', value: '354' },
      { label: 'In Transit', value: '67' },
      { label: 'Active Routes', value: '24' },
    ],
  },
  {
    key: 'stars',
    name: 'STARS',
    fullName: 'Speedex Tasks Allocation and Review System',
    description: 'Manages task assignments, FSM progression, coordinator workflows, and performance tracking.',
    icon: 'ti ti-clipboard-list',
    accentColor: '#0284C7',
    accentBg: 'rgba(2, 132, 199, 0.1)',
    stats: [
      { label: 'Active Tasks', value: '128' },
      { label: 'In Progress', value: '47' },
      { label: 'SLA Score', value: '97.4%' },
    ],
  },
  {
    key: 'foms',
    name: 'FOMS',
    fullName: 'Financial Operations Management System',
    description: 'Manages invoicing, billing, payroll basis, payment tracking, and financial reporting.',
    icon: 'ti ti-report-money',
    accentColor: '#4F46E5',
    accentBg: 'rgba(79, 70, 229, 0.1)',
    stats: [
      { label: 'For Review', value: '12' },
      { label: 'Overdue', value: '8' },
      { label: 'Collections', value: '₱2.4M' },
    ],
  },
];

/* ── Props ───────────────────────────────────────────────────────── */

export interface SystemSelectorPageProps {
  profile?: {
    name: string;
    role: string;
    avatarInitials: string;
  };
  /** Called with the selected system key after the entry animation. */
  onSelect: (systemKey: SystemKey) => void;
}

const defaultProfile = {
  name: 'FirstName LastName',
  role: 'System Administrator',
  avatarInitials: 'FL',
};

/* ── Component ───────────────────────────────────────────────────── */

export const SystemSelectorPage: React.FC<SystemSelectorPageProps> = ({
  profile = defaultProfile,
  onSelect,
}) => {
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [enteringSystem, setEnteringSystem] = useState<string | null>(null);

  const handleSelect = (key: SystemKey) => {
    if (enteringSystem) return; // prevent double-click
    setEnteringSystem(key);
    setTimeout(() => onSelect(key), 360);
  };

  const firstName = profile.name.split(' ')[0];

  return (
    <div className="sys-sel-root">
      {/* Ambient glow orbs */}
      <div className="sys-sel-orb sys-sel-orb-teal"   aria-hidden="true" />
      <div className="sys-sel-orb sys-sel-orb-indigo" aria-hidden="true" />
      <div className="sys-sel-orb sys-sel-orb-blue"   aria-hidden="true" />

      {/* Dot grid background */}
      <div className="sys-sel-grid-bg" aria-hidden="true" />

      <div className="sys-sel-container">

        {/* ── Top Bar ── */}
        <header className="sys-sel-topbar">
          <div className="sys-sel-brand" aria-label="Speedex logo">
            <img src="/logo.png" alt="Speedex Logo" className="sys-sel-brand-logo" />
          </div>

          <div className="sys-sel-topbar-right">
            <span className="sys-sel-admin-badge" aria-label="Administrator access">
              <i className="ti ti-shield-check" aria-hidden="true" />
              Administrator
            </span>
          </div>
        </header>

        {/* ── Greeting ── */}
        <section className="sys-sel-greeting" aria-label="User greeting">
          <div className="sys-sel-avatar-ring" aria-hidden="true">
            <div className="sys-sel-avatar-pulse" />
            <div className="sys-sel-avatar">{profile.avatarInitials}</div>
          </div>
          <div className="sys-sel-greeting-text">
            <h1 className="sys-sel-hello">Welcome back, {firstName}!</h1>
            <p className="sys-sel-tagline">
              You have administrator access to all{' '}
              <strong>{SPEEDEX_SYSTEMS.length} systems</strong>. Select one to continue.
            </p>
          </div>
        </section>

        {/* ── System Cards ── */}
        <section className="sys-sel-cards" aria-label="System selection" role="group">
          {SPEEDEX_SYSTEMS.map((sys, idx) => (
            <button
              key={sys.key}
              id={`sys-card-${sys.key}`}
              className={[
                'sys-card',
                hoveredSystem === sys.key ? 'is-hovered' : '',
                enteringSystem === sys.key ? 'is-entering' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSelect(sys.key)}
              onMouseEnter={() => setHoveredSystem(sys.key)}
              onMouseLeave={() => setHoveredSystem(null)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(sys.key)}
              style={
                {
                  '--sys-accent': sys.accentColor,
                  '--sys-accent-bg': sys.accentBg,
                  '--sys-delay': `${idx * 85}ms`,
                } as React.CSSProperties
              }
              aria-label={`Enter ${sys.fullName}`}
              aria-pressed={enteringSystem === sys.key}
            >
              {/* Top glow line on hover */}
              <div className="sys-card-glow-line" aria-hidden="true" />

              {/* System icon */}
              <div className="sys-card-icon-box" aria-hidden="true">
                <i className={sys.icon} />
              </div>

              {/* Name row */}
              <div className="sys-card-head">
                <span className="sys-card-abbr">{sys.name}</span>
                <span className="sys-card-operational" aria-label="System operational">
                  <span className="sys-card-status-dot" aria-hidden="true" />
                  Operational
                </span>
              </div>

              {/* Full system name */}
              <div className="sys-card-fullname">{sys.fullName}</div>

              {/* Description */}
              <p className="sys-card-desc">{sys.description}</p>

              {/* Quick stats */}
              <div className="sys-card-stats" aria-label={`${sys.name} live statistics`}>
                {sys.stats.map((stat) => (
                  <div key={stat.label} className="sys-card-stat-item">
                    <span className="sys-card-stat-val">{stat.value}</span>
                    <span className="sys-card-stat-lbl">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Enter CTA (visible on hover) */}
              <div className="sys-card-cta" aria-hidden="true">
                <span>Enter System</span>
                <i className="ti ti-arrow-right" />
              </div>
            </button>
          ))}
        </section>

        {/* ── Footer ── */}
        <footer className="sys-sel-footer" role="contentinfo">
          <i className="ti ti-lock-square-rounded" aria-hidden="true" />
          <span>
            All sessions are encrypted and access-logged.&nbsp;&nbsp;|&nbsp;&nbsp;Last login:
            Today, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </footer>

      </div>
    </div>
  );
};

export default SystemSelectorPage;
