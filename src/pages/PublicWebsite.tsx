import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components';
import './PublicWebsite.css';

interface WaybillEvent {
  status: 'done' | 'active' | 'upcoming';
  title: string;
  time: string;
  location: string;
  note?: string;
}

interface WaybillResult {
  waybillNo: string;
  statusText: string;
  statusType: 'transit' | 'delivered' | 'out';
  origin: string;
  destination: string;
  eta: string;
  events: WaybillEvent[];
}

const SAMPLE_TRACKING_DATA: Record<string, WaybillResult> = {
  'SPX-98214': {
    waybillNo: 'SPX-98214',
    statusText: 'In Transit',
    statusType: 'transit',
    origin: 'Metro Manila Hub',
    destination: 'Cebu City Distribution Hub',
    eta: 'Tomorrow by 4:00 PM',
    events: [
      { status: 'done', title: 'Package Picked Up', time: '8:40 AM', location: 'Malate Sorting Facility, Manila' },
      { status: 'done', title: 'Scanned at Central Hub', time: '1:15 PM', location: 'Speedex Logistics Hub 1, Manila' },
      { status: 'active', title: 'Linehaul Dispatch to Cebu', time: 'Updated 1 hour ago', location: 'In Transit via Inter-Island Cargo' },
      { status: 'upcoming', title: 'Out for Delivery', time: 'Estimated Tomorrow', location: 'Cebu Central Hub' },
    ],
  },
  'SPX-50123': {
    waybillNo: 'SPX-50123',
    statusText: 'Out for Delivery',
    statusType: 'out',
    origin: 'Pasig City Hub',
    destination: 'Quezon City Residential',
    eta: 'Today by 2:30 PM',
    events: [
      { status: 'done', title: 'Package Received from Sender', time: 'Yesterday 3:00 PM', location: 'Pasig Dropoff Center' },
      { status: 'done', title: 'Sorted & Prepared for Route', time: 'Today 6:30 AM', location: 'East Manila Delivery Station' },
      { status: 'active', title: 'Assigned to Courier Juan D.', time: 'Today 8:15 AM', location: 'Courier En Route' },
      { status: 'upcoming', title: 'Delivered to Recipient', time: 'Pending confirmation', location: 'Destination Address' },
    ],
  },
  'SPX-77402': {
    waybillNo: 'SPX-77402',
    statusText: 'Delivered',
    statusType: 'delivered',
    origin: 'Davao City Hub',
    destination: 'Cagayan de Oro Branch',
    eta: 'Delivered',
    events: [
      { status: 'done', title: 'Shipment Created', time: 'Sept 8, 2026', location: 'Davao Southern Hub' },
      { status: 'done', title: 'Sorted and Dispatched', time: 'Sept 9, 2026', location: 'Mindanao Regional Freight' },
      { status: 'done', title: 'Package Delivered & Signed', time: 'Sept 10, 2026 11:20 AM', location: 'CDO Downtown Office' },
    ],
  },
};

const ADVISORIES = [
  {
    id: 'adv-1',
    category: 'Weather Advisory',
    categoryType: 'weather' as const,
    date: 'Sept 10, 2026',
    title: 'Operations Advisory: DOST-PAGASA Southwest Monsoon Outlook',
    paragraphs: [
      'In line with the DOST-PAGASA heavy rainfall outlook caused by the Southwest Monsoon, pickups and deliveries may experience slight delays or temporary rescheduling in flood-prone areas across Luzon.',
      'All shipments in Speedex custody are stored securely inside climate-controlled regional sorting facilities. Normal transit operations will resume immediately as road and weather conditions clear.',
      'Expected rainfall today: 100–200 mm in Zambales, and 50–100 mm in Metro Manila, Bulacan, Cavite, Rizal, and neighboring provinces. (Source: PAGASA Weather Advisory No. 74).',
    ],
  },
  {
    id: 'adv-2',
    category: 'Holiday Schedule',
    categoryType: 'holiday' as const,
    date: 'Dec 8, 2025',
    title: 'Feast of the Immaculate Conception Operations Schedule',
    paragraphs: [
      'Speedex customer support desks and express courier linehaul will operate on standard holiday hours during the nationwide special non-working holiday.',
      'Corporate bulk pickups scheduled 24 hours in advance will proceed as arranged. Same-day express drops will be sorted for next business day delivery.',
    ],
  },
  {
    id: 'adv-3',
    category: 'Operations',
    categoryType: 'ops' as const,
    date: 'Aug 25, 2025',
    title: 'National Heroes Day Weekend Dispatch Schedule',
    paragraphs: [
      'Holiday operations notice for National Heroes Day. Air cargo cut-offs for Visayas and Mindanao shipments are adjusted to 12:00 NN.',
    ],
  },
  {
    id: 'adv-4',
    category: 'Weather Advisory',
    categoryType: 'weather' as const,
    date: 'July 21, 2025',
    title: 'Typhoon Season Maritime Cargo Safety Protocols',
    paragraphs: [
      'Inter-island sea freight schedules are coordinated closely with Philippine Coast Guard clearances to ensure vessel safety and cargo security.',
    ],
  },
  {
    id: 'adv-5',
    category: 'Holiday Schedule',
    categoryType: 'holiday' as const,
    date: 'June 12, 2025',
    title: 'Philippine Independence Day Service Hours',
    paragraphs: [
      'Standard holiday notice. Automated tracking and online portal services remain active 24/7.',
    ],
  },
];

export const PublicWebsite: React.FC = () => {
  const { triggerToast } = useToast();
  const [alertVisible, setAlertVisible] = useState(true);
  const [waybillInput, setWaybillInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<WaybillResult | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [openAdvisoryId, setOpenAdvisoryId] = useState<string | null>('adv-1');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const [menuOpen, setMenuOpen] = useState(false);

  /* ── Sticky-nav–aware smooth scroll ─────────────────────── */
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const navH = 68; // Must match .spx-nav-inner height
    const top = el.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
    window.history.pushState(null, '', `#${id}`);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerToast(
      'info',
      'Tracking Portal Coming Soon',
      'The public waybill tracking portal is currently being integrated. In the meantime, please contact our dispatch team below for status updates.',
      'Contact Support',
      () => { scrollToSection('contact'); },
      5000
    );
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    // Sections in top-to-bottom page order
    const sectionIds = ['advisories', 'about', 'contact'];
    const handleActiveSection = () => {
      const scrollY = window.scrollY;
      const threshold = scrollY + window.innerHeight * 0.35;

      // If near the very top, always highlight Home
      if (scrollY < 80) {
        setActiveSection('top');
        return;
      }

      // Find the last section whose top has entered the viewport threshold
      let active = 'top';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top + scrollY <= threshold) {
          active = id;
        }
      }
      setActiveSection(active);
    };

    window.addEventListener('scroll', handleActiveSection, { passive: true });
    handleActiveSection();
    return () => window.removeEventListener('scroll', handleActiveSection);
  }, []);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = waybillInput.trim().toUpperCase();
    if (!query) {
      setTrackingError('Please enter a valid waybill or tracking number.');
      setTrackingResult(null);
      return;
    }

    setTrackingError(null);
    if (SAMPLE_TRACKING_DATA[query]) {
      setTrackingResult(SAMPLE_TRACKING_DATA[query]);
    } else {
      // Generate realistic demo response for custom input
      setTrackingResult({
        waybillNo: query,
        statusText: 'In Transit',
        statusType: 'transit',
        origin: 'Manila Regional Hub',
        destination: 'Provincial Destination Hub',
        eta: 'Estimated 1-2 business days',
        events: [
          { status: 'done', title: 'Waybill Generated & Received', time: 'Today 8:00 AM', location: 'Speedex Manila Hub' },
          { status: 'done', title: 'Package Scanned & Sorted', time: 'Today 11:30 AM', location: 'Primary Sorting Center' },
          { status: 'active', title: 'In Transit to Destination', time: 'Updated 20 mins ago', location: 'Linehaul Fleet 14' },
          { status: 'upcoming', title: 'Out for Delivery', time: 'Pending Arrival', location: 'Local Delivery Station' },
        ],
      });
    }
  };

  const handlePresetClick = (preset: string) => {
    setWaybillInput(preset);
    setTrackingError(null);
    setTrackingResult(SAMPLE_TRACKING_DATA[preset] || null);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 1000);
  };

  const toggleAdvisory = (id: string) => {
    setOpenAdvisoryId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="spx-pub-root" id="top">
      {/* ── Operations Advisory Banner ── */}
      {alertVisible && (
        <div className="spx-alert-bar">
          <div className="spx-container spx-alert-inner">
            <div className="spx-alert-content">
              <i className="ti ti-alert-triangle spx-alert-icon" aria-hidden="true" />
              <div className="spx-alert-text">
                <span>
                  <b>Operations advisory (Sept 10, 2026):</b> Heavy rainfall from the Southwest Monsoon may affect delivery times in selected areas. All packages in Speedex hubs are safe.
                </span>
                <a
                  href="#advisories"
                  className="spx-alert-link"
                  onClick={(e) => { e.preventDefault(); scrollToSection('advisories'); }}
                >
                  Read advisories <i className="ti ti-arrow-down" aria-hidden="true" />
                </a>
              </div>
            </div>
            <button
              type="button"
              className="spx-alert-dismiss"
              onClick={() => setAlertVisible(false)}
              aria-label="Dismiss alert"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Navigation ── */}
      <header className={`spx-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="spx-nav-inner">
          <a
            href="#top"
            className="spx-logo-link"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.history.pushState(null, '', '#top');
              setMenuOpen(false);
            }}
            title="Back to top"
          >
            <img src="/logo.png" alt="Speedex Logo" className="spx-logo-img" />
          </a>

          {/* Desktop nav links */}
          <nav>
            <ul className="spx-nav-links">
              <li>
                <a
                  href="#top"
                  className={`spx-nav-link${activeSection === 'top' ? ' is-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.history.pushState(null, '', '#top');
                  }}
                >
                  Home
                </a>
              </li>
              <li>
                <a href="#track" className="spx-nav-link" onClick={handleTrackClick}>
                  Track
                </a>
              </li>
              <li><a
                href="#advisories"
                className={`spx-nav-link${activeSection === 'advisories' ? ' is-active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollToSection('advisories'); }}
              >Advisories</a></li>
              <li><a
                href="#about"
                className={`spx-nav-link${activeSection === 'about' ? ' is-active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}
              >About Us</a></li>
              <li><a
                href="#contact"
                className={`spx-nav-link${activeSection === 'contact' ? ' is-active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
              >Contact</a></li>
            </ul>
          </nav>

          <div className="spx-nav-actions">
            <Link to="/login" className="spx-btn-login">
              <i className="ti ti-login" aria-hidden="true" />
              <span>Log In</span>
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className={`spx-hamburger${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile drawer + backdrop */}
        {menuOpen && (
          <div
            className="spx-drawer-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <div className={`spx-drawer${menuOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="spx-drawer-head">
            <img src="/logo.png" alt="Speedex" className="spx-drawer-logo" />
            <button
              className="spx-drawer-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <nav className="spx-drawer-nav">
            {[
              { href: '#top',        label: 'Home',       icon: 'ti-home',        section: 'top',        onClick: (e: React.MouseEvent) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); } },
              { href: '#track',      label: 'Track',      icon: 'ti-map-pin',     section: null,         onClick: (e: React.MouseEvent) => { handleTrackClick(e); setMenuOpen(false); } },
              { href: '#advisories', label: 'Advisories', icon: 'ti-bell',        section: 'advisories', onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection('advisories'); setMenuOpen(false); } },
              { href: '#about',      label: 'About Us',   icon: 'ti-info-circle', section: 'about',      onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection('about'); setMenuOpen(false); } },
              { href: '#contact',    label: 'Contact',    icon: 'ti-mail',        section: 'contact',    onClick: (e: React.MouseEvent) => { e.preventDefault(); scrollToSection('contact'); setMenuOpen(false); } },
            ].map(({ href, label, icon, section, onClick }) => (
              <a
                key={href}
                href={href}
                className={`spx-drawer-link${section && activeSection === section ? ' is-active' : ''}`}
                onClick={onClick}
              >
                <i className={`ti ${icon}`} aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
          <div className="spx-drawer-footer">
            <Link to="/login" className="spx-drawer-login" onClick={() => setMenuOpen(false)}>
              <i className="ti ti-login" aria-hidden="true" /> Log In to Portal
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero Section ── */}
        <section className="spx-hero-section">
          <div className="spx-container spx-hero-grid">
            <div className="spx-hero-content">
              <h1 className="spx-hero-title">
                Your parcels, across the Philippines, <span className="spx-hero-highlight">tracked at every stop.</span>
              </h1>

              <p className="spx-hero-lead">
                Speedex couriers and regional hubs are stationed nationwide to deliver documents, freight, and parcels quickly, safely, and at a fair price.
              </p>

              <div className="spx-hero-buttons">
                <a href="#track" className="spx-btn-primary" onClick={handleTrackClick}>
                  <i className="ti ti-search" aria-hidden="true" />
                  <span>Track a Shipment</span>
                </a>
                <a href="#contact" className="spx-btn-secondary">
                  <span>Talk to Us</span>
                </a>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="spx-hero-right">
              <div className="spx-stats-cluster">
                <div className="spx-stat-circle stat-c1">
                  <strong>31</strong>
                  <span>Years of Service</span>
                </div>
                <div className="spx-stat-circle stat-c2">
                  <strong>100%</strong>
                  <span>Filipino-Owned</span>
                </div>
                <div className="spx-stat-circle stat-c3">
                  <strong>70+</strong>
                  <span>Sorting Hubs</span>
                </div>
              </div>
            </div>
            
            
          </div>
        </section>

        {/* ── Feature Pillars ── */}
        <section className="spx-section">
          <div className="spx-container">
            <div className="spx-section-header">
              <span className="spx-section-kicker">Why Choose Speedex</span>
              <h2 className="spx-section-title">Reliable, capable, and fairly priced</h2>
              <p className="spx-section-sub">
                What clients and enterprise partners can expect when they send with Speedex Courier and Forwarder.
              </p>
            </div>

            <div className="spx-pillars-grid">
              <div className="spx-pillar-card">
                <div className="spx-pillar-icon-box">
                  <i className="ti ti-shield-check" aria-hidden="true" />
                </div>
                <h3 className="spx-pillar-title">Reliable</h3>
                <p className="spx-pillar-desc">
                  Seasoned, highly trained logistics personnel and couriers stationed across key municipal hubs with guaranteed confidentiality and handling standards.
                </p>
              </div>

              <div className="spx-pillar-card">
                <div className="spx-pillar-icon-box">
                  <i className="ti ti-bolt" aria-hidden="true" />
                </div>
                <h3 className="spx-pillar-title">Capable</h3>
                <p className="spx-pillar-desc">
                  Equipped with dedicated ground and inter-island air freight channels ready to deliver parcels in the quickest, safest time window possible.
                </p>
              </div>

              <div className="spx-pillar-card">
                <div className="spx-pillar-icon-box">
                  <i className="ti ti-coin" aria-hidden="true" />
                </div>
                <h3 className="spx-pillar-title">Efficient</h3>
                <p className="spx-pillar-desc">
                  Transparent, cost-effective shipping rates tailored for businesses, eCommerce shops, and individual forwarders without hidden costs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Advisories Section ── */}
        <section className="spx-section alt" id="advisories">
          <div className="spx-container">
            <div className="spx-section-header">
              <span className="spx-section-kicker">Service Bulletins</span>
              <h2 className="spx-section-title">Advisories & Operational Notices</h2>
              <p className="spx-section-sub">
                Stay informed with official updates on weather forecasts, national holidays, port schedules, and dispatch protocols.
              </p>
            </div>

            <div className="spx-advisories-list">
              {ADVISORIES.map((adv) => {
                const isOpen = openAdvisoryId === adv.id;
                return (
                  <div key={adv.id} className={`spx-advisory-item type-${adv.categoryType} ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="spx-advisory-summary"
                      onClick={() => toggleAdvisory(adv.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="spx-advisory-title-wrap">
                        <span
                          className={`spx-advisory-badge ${adv.categoryType === 'weather'
                            ? 'spx-badge-weather'
                            : adv.categoryType === 'holiday'
                              ? 'spx-badge-holiday'
                              : 'spx-badge-ops'
                            }`}
                        >
                          {adv.category}
                        </span>
                        <h3 className="spx-advisory-heading">{adv.title}</h3>
                      </div>
                      <div className="spx-advisory-meta">
                        <span className="spx-advisory-date">{adv.date}</span>
                        <i className="ti ti-chevron-down spx-advisory-chevron" aria-hidden="true" />
                      </div>
                    </button>

                    <div className="spx-advisory-body-wrap">
                      <div className="spx-advisory-body">
                        <div className="spx-advisory-body-inner">
                          {adv.paragraphs.map((p, idx) => (
                            <p key={idx}>{p}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── About Us Section ── */}
        <section className="spx-section" id="about">
          <div className="spx-container spx-about-grid">
            <div className="spx-about-text">
              <span className="spx-section-kicker">Our Heritage</span>
              <h2 className="spx-section-title">A Filipino courier built on trust</h2>
              <p>
                Speedex Courier and Forwarder, Inc. is 100% Filipino-owned and has been registered with the Department of Trade and Industry since October 1993, and with the Securities and Exchange Commission (SEC) since October 6, 2009.
              </p>
              <p>
                We evaluate what each customer and corporate account needs, design optimized logistics workflows around it, rigorously train our operations team, and deliver packages promptly and securely. Every shipment is treated with strict confidentiality and meticulous care.
              </p>
            </div>

            <div className="spx-objectives-card">
              <h4>Our Core Objectives</h4>
              <ul className="spx-obj-list">
                <li className="spx-obj-item">
                  <div className="spx-obj-icon">
                    <i className="ti ti-check" aria-hidden="true" />
                  </div>
                  <div className="spx-obj-text">
                    Deliver prompt, excellent, and dependable courier service to all our clients across Luzon, Visayas, and Mindanao.
                  </div>
                </li>
                <li className="spx-obj-item">
                  <div className="spx-obj-icon">
                    <i className="ti ti-check" aria-hidden="true" />
                  </div>
                  <div className="spx-obj-text">
                    Give employees and courier partners room to grow, develop technical expertise, and advance their careers.
                  </div>
                </li>
                <li className="spx-obj-item">
                  <div className="spx-obj-icon">
                    <i className="ti ti-check" aria-hidden="true" />
                  </div>
                  <div className="spx-obj-text">
                    Lead the Philippine freight and parcel delivery industry with unwavering integrity, reliability, and social responsibility.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Contact Section ── */}
        <section className="spx-section alt" id="contact">
          <div className="spx-container spx-contact-grid">
            <div className="spx-contact-info">
              <span className="spx-section-kicker">Get in Touch</span>
              <h2 className="spx-section-title">We are here to assist you</h2>
              <p>
                Reach out to our customer support team or visit our administrative office for corporate logistics, rates, and parcel inquiries.
              </p>

              <div className="spx-contact-details">
                <div className="spx-contact-item">
                  <div className="spx-contact-icon-box">
                    <i className="ti ti-building" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="spx-contact-item-title">Head Office</div>
                    <div className="spx-contact-item-val">ECF Building, Malate, Manila, Philippines</div>
                  </div>
                </div>

                <div className="spx-contact-item">
                  <div className="spx-contact-icon-box">
                    <i className="ti ti-mail" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="spx-contact-item-title">Email Inquiries</div>
                    <a href="mailto:admin@myspeedex.net" className="spx-contact-item-val">
                      admin@myspeedex.net
                    </a>
                  </div>
                </div>

                <div className="spx-contact-item">
                  <div className="spx-contact-icon-box">
                    <i className="ti ti-phone" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="spx-contact-item-title">Telephone Numbers</div>
                    <a href="tel:0284004628" className="spx-contact-item-val">
                      (02) 8400-4628 to 29
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="spx-contact-form-card">
              <form onSubmit={handleContactSubmit}>
                <div className="spx-form-group">
                  <label htmlFor="contact-name" className="spx-form-label">Your Full Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="spx-form-input"
                    required
                    placeholder="Juan Dela Cruz"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div className="spx-form-group">
                  <label htmlFor="contact-email" className="spx-form-label">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="spx-form-input"
                    required
                    placeholder="juan@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>

                <div className="spx-form-group">
                  <label htmlFor="contact-subject" className="spx-form-label">Subject</label>
                  <select
                    id="contact-subject"
                    className="spx-form-select"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Waybill Assistance">Waybill / Tracking Assistance</option>
                    <option value="Corporate Account">Corporate Account / B2B Logistics</option>
                    <option value="Courier Careers">Courier & Driver Careers</option>
                  </select>
                </div>

                <div className="spx-form-group">
                  <label htmlFor="contact-message" className="spx-form-label">Message</label>
                  <textarea
                    id="contact-message"
                    className="spx-form-textarea"
                    rows={4}
                    required
                    placeholder="How can Speedex help with your logistics needs?"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>

                <button type="submit" className="spx-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="ti ti-send" aria-hidden="true" />
                  <span>Send Message</span>
                </button>

                {contactSuccess && (
                  <div className="spx-form-success" role="status">
                    <i className="ti ti-check" aria-hidden="true" />
                    <span>Message received! Our team will respond to your email promptly.</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="spx-footer">
        <div className="spx-container">
          <div className="spx-footer-grid">
            <div>
              <div className="spx-footer-brand-logo">
                <img src="/logo.png" alt="Speedex Logo" className="spx-footer-logo-img" />
              </div>
              <p className="spx-footer-brand-desc">
                Nationwide express parcel delivery, freight forwarding, and supply chain logistics built on Filipino trust.
              </p>
              <div className="spx-footer-tagline">
                <i className="ti ti-shield-check" aria-hidden="true" />
                <span>SEC & DTI Registered Since 1993</span>
              </div>
            </div>

            <div>
              <div className="spx-footer-col-title">Navigation</div>
              <ul className="spx-footer-links">
                <li><a href="#top" className="spx-footer-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
                <li><a href="#track" className="spx-footer-link" onClick={handleTrackClick}>Track Delivery</a></li>
                <li><a href="#advisories" className="spx-footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('advisories'); }}>Advisories</a></li>
                <li><a href="#about" className="spx-footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About Us</a></li>
                <li><a href="#contact" className="spx-footer-link" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact</a></li>
                <li><Link to="/login" className="spx-footer-link"><i className="ti ti-login" aria-hidden="true" /> Staff Login</Link></li>
              </ul>
            </div>


            <div>
              <div className="spx-footer-col-title">Contact &amp; Hub</div>
              <ul className="spx-footer-links">
                <li className="spx-footer-contact-item">
                  <i className="ti ti-map-pin spx-footer-contact-icon" aria-hidden="true" />
                  <span style={{ color: "#94A3B8" }}>ECF Building, Malate, Manila</span>
                </li>
                <li className="spx-footer-contact-item">
                  <i className="ti ti-mail spx-footer-contact-icon" aria-hidden="true" />
                  <a href="mailto:admin@myspeedex.net" className="spx-footer-link">admin@myspeedex.net</a>
                </li>
                <li className="spx-footer-contact-item">
                  <i className="ti ti-phone spx-footer-contact-icon" aria-hidden="true" />
                  <span style={{ color: "#94A3B8" }}>(02) 8400-4628 to 29</span>
                </li>
              </ul>
            </div>

          </div>{/* end spx-footer-grid */}

          <div className="spx-footer-bottom">
            <div>&copy; {new Date().getFullYear()} Speedex Courier and Forwarder, Inc. All rights reserved.</div>
            <div className="spx-footer-bottom-links">
              <a href="#top" className="spx-footer-link">Privacy Policy</a>
              <span aria-hidden="true">·</span>
              <a href="#top" className="spx-footer-link">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicWebsite;
