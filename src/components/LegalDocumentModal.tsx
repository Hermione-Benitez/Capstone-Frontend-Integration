import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
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
            <div>
              <h2 id="legal-modal-title" className="legal-modal-title">
                {isTerms ? 'Speedex Terms of Use' : 'Speedex Privacy Statement'}
              </h2>
              <p className="legal-modal-subtitle">
                {isTerms
                  ? 'Operational guidelines and platform usage standards for Speedex personnel.'
                  : 'Compliance standard pursuant to the Philippine Data Privacy Act of 2012.'}
              </p>
            </div>
            <button
              type="button"
              className="legal-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Segmented Document Tab Switcher */}
          <div className="legal-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isTerms}
              className={`legal-modal-tab-btn ${isTerms ? 'active' : ''}`}
              onClick={() => onSwitchType('terms')}
            >
              Terms of Use
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isTerms}
              className={`legal-modal-tab-btn ${!isTerms ? 'active' : ''}`}
              onClick={() => onSwitchType('privacy')}
            >
              Privacy Statement
            </button>
          </div>
        </header>

        {/* ── MODAL BODY CONTENT ── */}
        <div className="legal-modal-body">
          {isTerms ? (
            <article className="legal-document-content">
              <section className="legal-section">
                <h3>1. Scope &amp; Acceptance of Terms</h3>
                <p>
                  Welcome to the <strong>Speedex Logistics Portal</strong> and enterprise operational platform.
                </p>
                <p>
                  By accessing, signing into, or utilizing any portion of this portal or its connected services, you certify that you are an authorized employee, courier, contractor, or accredited partner of <strong>Speedex Courier &amp; Forwarder, Inc.</strong>, and agree to be bound by these Terms of Use and company security guidelines. Unauthorized access, automated scraping, or exceeding permitted access levels is strictly prohibited and subject to criminal prosecution under Republic Act No. 10175 (Cybercrime Prevention Act of 2012).
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Authorized Access &amp; User Conduct</h3>
                <p>
                  Access to Speedex systems is restricted strictly to authenticated personnel with active corporate credentials.
                </p>
                <ul>
                  <li>
                    <strong>Credential Protection:</strong> You are strictly responsible for maintaining the confidentiality of your assigned credentials. Credential sharing, unauthorized delegation, or operating under proxy identities is strictly prohibited.
                  </li>
                  <li>
                    <strong>System Integrity:</strong> You agree not to reverse engineer, decompile, probe, scan, or introduce automated scripts, denial-of-service traffic, or unauthorized payloads into any Speedex network interface, digital endpoint, or operational service.
                  </li>
                  <li>
                    <strong>Authentication Enforcement:</strong> Any attempt to circumvent gateway authentication, manipulate authorization tokens, forge request headers, or tamper with active sessions will trigger immediate account revocation, audit logging, and legal review.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Operational Accuracy &amp; Consignment Records</h3>
                <p>
                  Speedex operational systems record and dispatch mission-critical logistics data, tracking milestones, and financial transactions.
                </p>
                <ul>
                  <li>
                    <strong>Truthfulness of Entry:</strong> Authorized users must ensure that all recorded consignment weights, package metrics, proof-of-delivery acknowledgments, and operational status updates are truthful, accurate, and promptly filed.
                  </li>
                  <li>
                    <strong>Zero Tolerance for Falsification:</strong> Deliberately falsifying delivery confirmations, altering cash collection records, or manipulating shipment timestamps constitutes serious misconduct and grounds for immediate termination and civil or criminal statutory action.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Session Governance &amp; Threat Mitigation</h3>
                <p>
                  To protect enterprise infrastructure, customer consignments, and corporate data, Speedex enforces automated request throttling, session anomaly detection, and mandatory inactivity timeouts. Sessions left unattended will be automatically terminated to prevent unauthorized physical terminal access.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Intellectual Property</h3>
                <p>
                  All software code, user interface designs, operational workflows, documentation, trademarks, and logos associated with Speedex and its digital platforms are the exclusive intellectual property of <strong>Speedex Courier &amp; Forwarder, Inc.</strong>, registered under the laws of the Republic of the Philippines. Unauthorized copying, mirroring, or distribution is prohibited.
                </p>
              </section>

              <section className="legal-section">
                <h3>6. System Availability &amp; Platform SLA</h3>
                <p>
                  Speedex provides access to its operational platforms on an enterprise high-availability infrastructure. Periodic maintenance or telecommunications provider interruptions may result in transient downtime. Speedex disclaims liability for indirect operational impacts arising from unforeseen carrier or network outages.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Governing Law &amp; Legal Jurisdiction</h3>
                <p>
                  These Terms of Use are governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>, including Republic Act No. 10175 (Cybercrime Prevention Act of 2012), Republic Act No. 8792 (Electronic Commerce Act of 2000), and regulations issued by the Department of Trade and Industry (DTI) and Department of Information and Communications Technology (DICT).
                </p>
              </section>
            </article>
          ) : (
            <article className="legal-document-content">
              <section className="legal-section">
                <h3>1. Overview &amp; Data Controller</h3>
                <p>
                  <strong>Speedex Courier &amp; Forwarder, Inc.</strong> (&quot;Speedex&quot;) respects and upholds your fundamental right to privacy. This Privacy Statement describes our policies and practices regarding the collection, processing, storage, and protection of personal and operational data across the Speedex portal, Public Tracking site, and connected logistics systems.
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
                    <strong>Employee &amp; Staff Data:</strong> Full name, employee identification number (ID), enterprise email address, department, organizational role, and contact phone number.
                  </li>
                  <li>
                    <strong>Customer &amp; Consignment Data:</strong> Consignor and consignee names, pickup and delivery physical addresses, contact telephone numbers, package descriptions, item valuations, and recipient proof-of-delivery signatures.
                  </li>
                  <li>
                    <strong>Operational &amp; Telemetry Data:</strong> Waybill barcode scans, delivery milestone transitions, audit log interactions, and session verification logs.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Purpose of Data Processing</h3>
                <p>The collected data is utilized exclusively for legitimate corporate purposes, including:</p>
                <ul>
                  <li>Facilitating seamless nation-wide parcel routing, linehaul transit, and final-mile doorstep delivery.</li>
                  <li>Executing automated task allocation and courier dispatch balancing to ensure delivery SLA compliance.</li>
                  <li>Generating waybills, invoices, payment receipts, and tax records in accordance with Philippine Bureau of Internal Revenue (BIR) standards.</li>
                  <li>Safeguarding system infrastructure against unauthorized intrusion, credential theft, and fraudulent activity.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>4. Data Security &amp; Information Protection Standards</h3>
                <p>
                  Speedex implements comprehensive technical, organizational, and physical security controls to safeguard personal and operational data across all platforms:
                </p>
                <ul>
                  <li>
                    <strong>Data in Transit:</strong> All communications and transactions between client endpoints, the central portal, and operational subsystems are protected using industry-standard transport-level cryptographic protocols.
                  </li>
                  <li>
                    <strong>Data at Rest:</strong> Sensitive records, access tokens, and credentials are encrypted and stored using enterprise-grade cryptographic controls with irreversible one-way salted protection for user authentication data.
                  </li>
                  <li>
                    <strong>Role-Based Access Governance:</strong> Internal personnel and system accounts are strictly scoped to the least-privilege principle, ensuring access only to data categories required for verified business functions.
                  </li>
                  <li>
                    <strong>Continuous Security Monitoring:</strong> Automated threat mitigation, intrusion detection, and immutable access logging are maintained to proactively detect, isolate, and neutralize unauthorized access attempts.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>5. Non-Disclosure &amp; Inter-System Sharing</h3>
                <p>
                  Speedex does not sell, trade, rent, or lease personal or customer information to external marketing agencies or unauthorized third parties. Information is shared strictly between Speedex internal operational platforms for the direct fulfillment of logistics workflows.
                </p>
              </section>

              <section className="legal-section">
                <h3>6. Data Retention &amp; Disposal</h3>
                <p>
                  Personal and operational records are retained only for as long as required to accomplish the declared purposes, or as mandated by applicable Philippine statutory retention laws. Upon expiration of the retention period, records are securely shredded or permanently anonymized.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Data Subject Rights &amp; Inquiries</h3>
                <p>
                  Under RA 10173, you are entitled to exercise your rights as a Data Subject, which include the Right to be Informed, Right to Access, Right to Rectification, Right to Erasure, and Right to Damages.
                </p>
                <div className="legal-contact-card">
                  <div><strong>Speedex Data Protection Office</strong></div>
                  <div>Email: <a href="mailto:admin@myspeedex.net">admin@myspeedex.net</a></div>
                  <div>Landline: (02) 8400-4628 to 29</div>
                  <div>Address: ECF Building, Malate, Manila, Philippines</div>
                </div>
              </section>
            </article>
          )}
        </div>

      </div>
    </div>
  );
};

export default LegalDocumentModal;
