import React, { useEffect, useRef } from 'react';
import { FileText, ShieldCheck, X, Check, ExternalLink, Printer } from 'lucide-react';
import './LegalDocumentModal.css';

export type LegalDocType = 'terms' | 'privacy';

export interface LegalDocumentModalProps {
  isOpen: boolean;
  type: LegalDocType;
  onClose: () => void;
  onSwitchType: (type: LegalDocType) => void;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  isOpen,
  type,
  onClose,
  onSwitchType,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isTerms = type === 'terms';

  return (
    <div
      className="legal-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="legal-modal-container" ref={dialogRef}>
        {/* ── MODAL HEADER ── */}
        <header className="legal-modal-header">
          <div className="legal-modal-title-row">
            <div className="legal-modal-icon-badge" aria-hidden="true">
              {isTerms ? <FileText size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <span className="legal-modal-kicker">
                {isTerms
                  ? 'Enterprise Operational Standard'
                  : 'Republic Act No. 10173 (Data Privacy Act of 2012)'}
              </span>
              <h2 id="legal-modal-title" className="legal-modal-title">
                {isTerms ? 'Speedex Terms of Use' : 'Speedex Privacy Statement'}
              </h2>
            </div>
            <button
              type="button"
              className="legal-modal-close-btn"
              onClick={onClose}
              aria-label="Close legal document dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Document Tab Switcher */}
          <div className="legal-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isTerms}
              className={`legal-modal-tab-btn ${isTerms ? 'active' : ''}`}
              onClick={() => onSwitchType('terms')}
            >
              <FileText size={15} />
              <span>Terms of Use</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isTerms}
              className={`legal-modal-tab-btn ${!isTerms ? 'active' : ''}`}
              onClick={() => onSwitchType('privacy')}
            >
              <ShieldCheck size={15} />
              <span>Privacy Statement</span>
            </button>
          </div>
        </header>

        {/* ── MODAL BODY CONTENT ── */}
        <div className="legal-modal-body">
          {isTerms ? (
            <article className="legal-document-content">
              <div className="legal-version-badge">
                <span>Document Version: <strong>v1.2 (2026 Enterprise Release)</strong></span>
                <span>·</span>
                <span>Speedex Courier &amp; Forwarder, Inc.</span>
              </div>

              <section className="legal-section">
                <h3>1. Introduction &amp; Acceptance of Terms</h3>
                <p>
                  Welcome to the <strong>Speedex Central Unified Gateway</strong> and integrated operational ecosystem, which includes the Speedex Task Allocation &amp; Review System (<strong>STARS</strong>), Delivery Management System (<strong>DMS</strong>), and Financial Operations Management System (<strong>FOMS</strong>).
                </p>
                <p>
                  By accessing, signing into, or utilizing any portion of this portal or its connected subsystems, you certify that you are an authorized employee, contractor, courier, or operational partner of <strong>Speedex Courier &amp; Forwarder, Inc.</strong>, and agree to be legally bound by these Terms of Use and all applicable guidelines. If you do not agree with any provision herein, you must immediately terminate your session and refrain from accessing the systems.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Authorized Access &amp; User Conduct</h3>
                <p>
                  Access to Speedex internal platforms is restricted strictly to authorized corporate personnel with valid credentials assigned by the Speedex System Administration team.
                </p>
                <ul>
                  <li>
                    <strong>Account Credential Protection:</strong> You are responsible for preserving the absolute confidentiality of your assigned Employee ID, username, and authentication password. Password sharing, credential loaning, or utilizing unauthorized proxy identities is strictly prohibited.
                  </li>
                  <li>
                    <strong>No Prohibited Interventions:</strong> You agree not to reverse engineer, decompile, intercept, disrupt, or introduce automated scrapers, malicious scripts, or denial-of-service vectors into any Speedex service account, micro-frontend, or REST API endpoint.
                  </li>
                  <li>
                    <strong>Single Sign-On Integrity:</strong> Bypassing the Central One-Login gateway or tampering with JWT claims, expiration timestamps, or token handoff query fragments will trigger immediate account suspension and automated security review.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Operational Accuracy &amp; Consignment Data</h3>
                <p>
                  Speedex systems process mission-critical national logistics records, real-time dispatch schedules, cash-on-delivery (COD) collections, and waybill tracking milestones.
                </p>
                <ul>
                  <li>
                    <strong>Truthfulness of Entry:</strong> Employees, couriers, and dispatchers must ensure all entered parcel weights, package dimensions, recipient signatures, and delivery status transitions (e.g. <em>In Transit</em>, <em>Out for Delivery</em>, <em>Delivered</em>, <em>Failed Delivery</em>) are accurate and timely.
                  </li>
                  <li>
                    <strong>Zero Tolerance for Falsification:</strong> Falsifying delivery proof, tampering with financial ledgers, or misrepresenting task completion timestamps constitutes gross misconduct and grounds for disciplinary termination and statutory legal prosecution.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Session Management &amp; Rate Limiting Security</h3>
                <p>
                  To protect company assets and consignor data, Speedex implements enterprise-grade dual-layer sliding-window rate limiting, active session token verification, and 15-minute inactivity revocation. Users will be automatically logged out after periods of idle inactivity to prevent unauthorized physical terminal access.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Intellectual Property</h3>
                <p>
                  All software code, user interface designs, operational workflows, documentation, trademarks, and logos associated with Speedex, STARS, DMS, FOMS, and OneUI are the exclusive intellectual property of <strong>Speedex Courier &amp; Forwarder, Inc.</strong>, registered under the laws of the Republic of the Philippines. Unauthorized copying, mirroring, or distribution is prohibited.
                </p>
              </section>

              <section className="legal-section">
                <h3>6. System Availability &amp; Service SLA</h3>
                <p>
                  Speedex provides access to its digital dashboards on an enterprise high-availability infrastructure. However, scheduled maintenance windows, network carrier disruptions, or regional telecommunications outages may cause transient service interruptions. Speedex disclaims liability for indirect damages arising from unforeseen system downtime.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Governing Law &amp; Jurisdiction</h3>
                <p>
                  These Terms of Use are governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>, including regulations from the Department of Trade and Industry (DTI), the Securities and Exchange Commission (SEC), and the Department of Information and Communications Technology (DICT). Any legal proceedings arising hereunder shall be subject to the exclusive jurisdiction of the competent courts of the Philippines.
                </p>
              </section>
            </article>
          ) : (
            <article className="legal-document-content">
              <div className="legal-version-badge">
                <span>Compliance Standard: <strong>National Privacy Commission (NPC) · RA 10173</strong></span>
                <span>·</span>
                <span>Speedex Courier &amp; Forwarder, Inc.</span>
              </div>

              <section className="legal-section">
                <h3>1. Overview &amp; Data Controller</h3>
                <p>
                  <strong>Speedex Courier &amp; Forwarder, Inc.</strong> (&quot;Speedex&quot;) respects and upholds your fundamental right to privacy. This Privacy Statement describes our policies and practices regarding the collection, processing, storage, and protection of personal and operational data across our Central Gateway, Public Tracking Site, and integrated subsystems (STARS, DMS, FOMS).
                </p>
                <p>
                  Speedex acts as the <strong>Personal Information Controller (PIC)</strong> under the <strong>Republic of the Philippines Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, its Implementing Rules and Regulations (IRR), and circulars issued by the National Privacy Commission (NPC).
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Categories of Data We Collect</h3>
                <p>We collect and process only data that is necessary, legitimate, and proportional to our logistics and operational business needs:</p>
                <ul>
                  <li>
                    <strong>Employee &amp; Staff Data:</strong> Full name, employee identification number (ID), enterprise email address, department, organizational role, contact phone number, and avatar initials or profile photo.
                  </li>
                  <li>
                    <strong>Customer &amp; Consignment Data:</strong> Consignor and consignee names, pickup and delivery physical addresses, contact telephone numbers, package descriptions, item valuations, and recipient proof-of-delivery signatures.
                  </li>
                  <li>
                    <strong>Operational &amp; Telemetry Data:</strong> Real-time GPS coordinates of courier delivery runs, timestamped waybill barcode scans, delivery milestone transitions, audit log interactions, user-agent details, and IP addresses for session verification.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Purpose of Data Processing</h3>
                <p>The collected data is utilized exclusively for legitimate corporate purposes, including:</p>
                <ul>
                  <li>Facilitating seamless nation-wide parcel routing, linehaul transit, and final-mile doorstep delivery.</li>
                  <li>Executing automated task allocation and courier dispatch balancing to prevent employee overload and ensure delivery SLA compliance.</li>
                  <li>Generating waybills, invoices, payment receipts, and tax records in accordance with Philippine Bureau of Internal Revenue (BIR) standards.</li>
                  <li>Safeguarding system infrastructure against unauthorized intrusion, credential theft, and fraudulent activity through dual-layer rate limiting.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Data Security &amp; Cryptographic Standards</h3>
                <p>
                  Speedex implements rigorous technical, organizational, and physical security measures to protect personal data:
                </p>
                <ul>
                  <li>
                    <strong>In Transit:</strong> All communications between your browser, the Central Gateway, and the underlying subsystems are strictly encrypted using <strong>Transport Layer Security (TLS 1.3)</strong>.
                  </li>
                  <li>
                    <strong>At Rest:</strong> Sensitive credentials, tokens, and database stores are encrypted using <strong>AES-256 standard encryption</strong> with salted cryptographic hashing for passwords.
                  </li>
                  <li>
                    <strong>Role-Based Access (RBAC):</strong> Personnel have access only to the data categories required to perform their specific duties (e.g. Couriers view delivery routes; Accountants view financial invoices).
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>5. Non-Disclosure &amp; Inter-System Sharing</h3>
                <p>
                  Speedex does not sell, trade, rent, or lease personal or customer information to external marketing agencies or unauthorized third parties. Information is shared strictly between Speedex internal subsystems (STARS, DMS, FOMS) via authenticated, signed JSON Web Tokens (JWT) for the direct fulfillment of logistics and accounting workflows.
                </p>
              </section>

              <section className="legal-section">
                <h3>6. Data Retention &amp; Disposal</h3>
                <p>
                  Personal and operational records are retained only for as long as required to accomplish the declared purposes, or as mandated by applicable Philippine statutory retention laws (such as 10-year accounting records under the National Internal Revenue Code). Upon expiration of the retention period, records are securely shredded or permanently anonymized.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Data Subject Rights &amp; DPO Inquiries</h3>
                <p>
                  Under RA 10173, you are entitled to exercise your rights as a Data Subject, which include:
                </p>
                <ul>
                  <li>The <strong>Right to be Informed</strong> whether your personal data is being processed.</li>
                  <li>The <strong>Right to Access</strong> reasonable details of your data in our systems.</li>
                  <li>The <strong>Right to Rectification</strong> to dispute inaccuracies and have errors corrected.</li>
                  <li>The <strong>Right to Erasure or Blocking</strong> of unwarranted data.</li>
                  <li>The <strong>Right to Damages</strong> for substantiated privacy violations.</li>
                </ul>
                <p>
                  To exercise any of these rights or to report a privacy concern, please contact our <strong>Data Protection Office (DPO)</strong>:
                </p>
                <div className="legal-contact-card">
                  <div><strong>Speedex Data Protection Office</strong></div>
                  <div>Email: <a href="mailto:dpo@myspeedex.net">dpo@myspeedex.net</a> / <a href="mailto:admin@myspeedex.net">admin@myspeedex.net</a></div>
                  <div>Speedex Logistics Hub 1, Manila, Philippines</div>
                </div>
              </section>
            </article>
          )}
        </div>

        {/* ── MODAL FOOTER ── */}
        <footer className="legal-modal-footer">
          <div className="legal-modal-footer-info">
            <span className="compliance-tag">
              <Check size={13} />
              {isTerms ? 'Speedex Corporate Governance' : 'RA 10173 / NPC Registered'}
            </span>
            <span className="legal-modal-footer-sub">
              {isTerms ? 'Applicable to STARS, DMS, & FOMS' : 'Official Speedex Data Privacy Standard'}
            </span>
          </div>

          <div className="legal-modal-footer-actions">
            <button
              type="button"
              className="legal-modal-switch-btn"
              onClick={() => onSwitchType(isTerms ? 'privacy' : 'terms')}
            >
              <span>View {isTerms ? 'Privacy Statement' : 'Terms of Use'}</span>
            </button>
            <button
              type="button"
              className="legal-modal-primary-btn"
              onClick={onClose}
            >
              <span>I Understand &amp; Close</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LegalDocumentModal;
