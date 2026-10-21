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
    employeeId?: string;
  };
  allowedSystems?: string[];
  /** Called with the selected system key after the entry animation. */
  onSelect: (systemKey: SystemKey) => void;
  /** Optional callback to return to the public website view. */
  onPublicHome?: () => void;
  /** Optional callback to log out. */
  onLogout?: () => void;
}

const defaultProfile = {
  name: 'FirstName LastName',
  role: 'System Administrator',
  avatarInitials: 'FL',
  employeeId: '',
};

/* ── Component ───────────────────────────────────────────────────── */

export const SystemSelectorPage: React.FC<SystemSelectorPageProps> = ({
  profile = defaultProfile,
  allowedSystems,
  onSelect,
  onPublicHome,
  onLogout,
}) => {
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [enteringSystem, setEnteringSystem] = useState<string | null>(null);

  // Normalize allowed systems list (case-insensitive)
  const normalizedAllowed = React.useMemo(() => {
    if (!allowedSystems || allowedSystems.length === 0) {
      return ['STARS'];
    }
    return allowedSystems.map((s) => s.trim().toUpperCase());
  }, [allowedSystems]);

  const isSystemAllowed = (sysKey: SystemKey): boolean => {
    // Master admin 0000 has access to all systems
    if (profile.employeeId === '0000') return true;
    const keyUpper = sysKey.toUpperCase();
    return normalizedAllowed.some(
      (a) => a === keyUpper || (keyUpper === 'DMS' && a.includes('DMS')) || (keyUpper === 'STARS' && a.includes('STARS')) || (keyUpper === 'FOMS' && a.includes('FOMS'))
    );
  };

  const handleSelect = (key: SystemKey) => {
    if (!isSystemAllowed(key)) return; // blocked if locked
    if (enteringSystem) return; // prevent double-click
    setEnteringSystem(key);
    setTimeout(() => onSelect(key), 360);
  };

  const firstName = profile.name.split(' ')[0];
  const allowedCount = SPEEDEX_SYSTEMS.filter((s) => isSystemAllowed(s.key)).length;

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
            {onPublicHome && (
              <button
                type="button"
                className="sys-sel-topbar-btn"
                onClick={onPublicHome}
                title="View public portal"
              >
                <i className="ti ti-world" aria-hidden="true" />
                <span>Public Website</span>
              </button>
            )}

            <span className="sys-sel-admin-badge" aria-label={`${profile.role || 'Administrator'} access`}>
              <i className="ti ti-shield-check" aria-hidden="true" />
              {profile.role || 'Administrator'}
            </span>

            {onLogout && (
              <button
                type="button"
                className="sys-sel-topbar-btn sys-sel-logout-btn"
                onClick={onLogout}
                title="Sign out of portal"
              >
                <i className="ti ti-logout" aria-hidden="true" />
                <span>Log Out</span>
              </button>
            )}
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
              Signed in as <strong>{profile.role || 'Staff'}</strong> · Access to{' '}
              <strong>
                {allowedCount === SPEEDEX_SYSTEMS.length
                  ? `all ${SPEEDEX_SYSTEMS.length} systems`
                  : `${allowedCount} of ${SPEEDEX_SYSTEMS.length} systems`}
              </strong>
              . {allowedCount === 1 ? 'Enter your authorized system to continue.' : 'Select an authorized system to continue.'}
            </p>
          </div>
        </section>

        {/* ── System Cards ── */}
        <section className="sys-sel-cards" aria-label="System selection" role="group">
          {SPEEDEX_SYSTEMS.map((sys, idx) => {
            const isAllowed = isSystemAllowed(sys.key);
            return (
              <button
                key={sys.key}
                id={`sys-card-${sys.key}`}
                className={[
                  'sys-card',
                  !isAllowed ? 'is-locked' : '',
                  hoveredSystem === sys.key && isAllowed ? 'is-hovered' : '',
                  enteringSystem === sys.key ? 'is-entering' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelect(sys.key)}
                onMouseEnter={() => isAllowed && setHoveredSystem(sys.key)}
                onMouseLeave={() => setHoveredSystem(null)}
                onKeyDown={(e) => isAllowed && e.key === 'Enter' && handleSelect(sys.key)}
                style={
                  {
                    '--sys-accent': sys.accentColor,
                    '--sys-accent-bg': sys.accentBg,
                    '--sys-delay': `${idx * 85}ms`,
                  } as React.CSSProperties
                }
                aria-label={isAllowed ? `Enter ${sys.fullName}` : `${sys.fullName} — Access Restricted`}
                aria-disabled={!isAllowed}
                disabled={!isAllowed}
                title={!isAllowed ? `Your account does not have access to ${sys.name}. Contact your administrator to request access.` : undefined}
                aria-pressed={enteringSystem === sys.key}
              >
                {/* Top glow line on hover */}
                {isAllowed && <div className="sys-card-glow-line" aria-hidden="true" />}

                {/* System icon */}
                <div className="sys-card-icon-box" aria-hidden="true">
                  <i className={sys.icon} />
                </div>

                {/* Name row */}
                <div className="sys-card-head">
                  <span className="sys-card-abbr">{sys.name}</span>
                  {isAllowed ? (
                    <span className="sys-card-operational" aria-label="System operational">
                      <span className="sys-card-status-dot" aria-hidden="true" />
                      Operational
                    </span>
                  ) : (
                    <span className="sys-card-locked-badge" aria-label="Access Restricted">
                      <i className="ti ti-lock" aria-hidden="true" />
                      Locked
                    </span>
                  )}
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

                {/* Enter / Locked CTA */}
                {isAllowed ? (
                  <div className="sys-card-cta" aria-hidden="true">
                    <span>Enter System</span>
                    <i className="ti ti-arrow-right" />
                  </div>
                ) : (
                  <div className="sys-card-cta is-locked-cta" aria-hidden="true">
                    <i className="ti ti-lock" />
                    <span>Access Restricted</span>
                  </div>
                )}
              </button>
            );
          })}
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
