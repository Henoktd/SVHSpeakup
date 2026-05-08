import { useEffect, useState } from "react";
import type { ReporterCaseAccessResponse } from "@svh/types";
import { Link, useLocation } from "react-router-dom";
import { accessReporterCase } from "../lib/api";

interface TrackCaseLocationState {
  caseId?: string;
  secret?: string;
}

const progressSteps = ["received", "investigation", "action_taken"] as const;

export function TrackCasePage() {
  const location = useLocation();
  const locationState = (location.state as TrackCaseLocationState | null) ?? null;
  const [caseId, setCaseId] = useState(locationState?.caseId ?? "");
  const [secret, setSecret] = useState(locationState?.secret ?? "");
  const [caseData, setCaseData] = useState<ReporterCaseAccessResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!locationState?.caseId || !locationState.secret) {
      return;
    }

    void handleAccess(locationState.caseId, locationState.secret);
    // We only want the initial state-based auto load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccess(nextCaseId = caseId, nextSecret = secret) {
    setError(null);
    setIsLoading(true);

    try {
      const result = await accessReporterCase({
        caseId: nextCaseId,
        secret: nextSecret
      });

      setCaseData(result);
    } catch (accessError) {
      setCaseData(null);
      setError(
        accessError instanceof Error
          ? accessError.message
          : "Unable to access the case."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const activeStep = getActiveStep(caseData?.status);

  return (
    <>
      <header className="topbar shell narrow">
        <Link className="brand-lockup compact" to="/">
          <img alt="Solstice Ventures Holding" src="/brand/svh-logo-horizontal.png" />
        </Link>

        <nav className="topnav">
          <Link to="/report">New report</Link>
          <Link to="/track">Track case</Link>
        </nav>
      </header>

      <main className="shell narrow tracker-shell">
        <section className="tracker-hero">
          <p className="eyebrow">Secure follow-up</p>
          <h1>Track an existing case</h1>
          <p className="lede centered-copy">
            Enter the case ID and secret you received after submitting your
            report. This view stays anonymous and only exposes your case data.
          </p>
        </section>

        <section className="tracker-access-card">
          <div className="tracker-access-grid">
            <label className="field">
              <span>Case ID</span>
              <input
                onChange={(event) => setCaseId(event.target.value)}
                placeholder="SVH-2026-000124"
                value={caseId}
              />
            </label>
            <label className="field">
              <span>Secret</span>
              <input
                onChange={(event) => setSecret(event.target.value)}
                placeholder="RIVER-GLASS-4821"
                value={secret}
              />
            </label>
          </div>
          <div className="tracker-access-actions">
            <button
              className="button primary"
              disabled={!caseId || !secret || isLoading}
              onClick={() => void handleAccess()}
              type="button"
            >
              {isLoading ? "Opening case..." : "Access case"}
            </button>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
        </section>

        {caseData ? (
          <section className="tracker-layout">
            <article className="tracker-panel">
              <div className="tracker-badges">
                <span className="tracker-badge">Case: {caseData.caseId}</span>
                <span className="tracker-badge muted">{caseData.statusLabel}</span>
              </div>

              <h2>Submission tracking</h2>
              <p className="lede">
                Your report is recorded in the SVH SpeakUp workflow. Activity
                appears below as investigators update the case.
              </p>

              <div className="tracker-progress-card">
                {progressSteps.map((step, index) => {
                  const isComplete = index <= activeStep;
                  return (
                    <div
                      className={`tracker-progress-step${isComplete ? " active" : ""}`}
                      key={step}
                    >
                      <div className="tracker-progress-index">{index + 1}</div>
                      <div>
                        <strong>{formatProgressLabel(step)}</strong>
                        <p>{formatProgressDescription(step)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="tracker-panel">
              <h2>Case summary</h2>
              <dl className="tracker-summary-grid">
                <div>
                  <dt>Category</dt>
                  <dd>{caseData.categoryLabel}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(caseData.submittedAt)}</dd>
                </div>
                <div>
                  <dt>Last activity</dt>
                  <dd>{formatDateTime(caseData.lastActivityAt)}</dd>
                </div>
                <div>
                  <dt>Email updates</dt>
                  <dd>{caseData.reporterEmail ?? "Not added yet"}</dd>
                </div>
              </dl>

              <div className="tracker-narrative">
                <h3>{caseData.title}</h3>
                <p>{caseData.description}</p>
              </div>

              <div className="tracker-detail-grid">
                <div>
                  <span>Incident date</span>
                  <strong>
                    {caseData.incidentDateText
                      ? formatDateTime(caseData.incidentDateText)
                      : "Not provided"}
                  </strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{caseData.locationText || "Not provided"}</strong>
                </div>
                <div>
                  <span>People involved</span>
                  <strong>{caseData.peopleInvolved || "Not provided"}</strong>
                </div>
                <div>
                  <span>Evidence notes</span>
                  <strong>{caseData.evidenceNotes || "Not provided"}</strong>
                </div>
              </div>

              <section className="tracker-narrative tracker-narrative-secondary">
                <h3>Presidential escalation context</h3>
                <p>{caseData.presidentialEscalationReason}</p>
              </section>

              <div className="tracker-detail-grid">
                <div>
                  <span>Raised through normal channels</span>
                  <strong>
                    {formatBooleanLabel(caseData.raisedThroughNormalChannels)}
                  </strong>
                </div>
                <div>
                  <span>Potential impact</span>
                  <strong>{caseData.potentialImpactLabel || "Not provided"}</strong>
                </div>
                <div>
                  <span>Urgency</span>
                  <strong>{caseData.urgencyLabel || "Not provided"}</strong>
                </div>
                <div>
                  <span>Local action summary</span>
                  <strong>
                    {caseData.normalChannelActionSummary || "Not provided"}
                  </strong>
                </div>
              </div>

              <div className="tracker-tag-list">
                {caseData.presidentialEscalationFactorLabels.map((label) => (
                  <span className="tracker-badge muted" key={label}>
                    {label}
                  </span>
                ))}
              </div>

              {caseData.presidentialEscalationOtherDetail ? (
                <div className="tracker-narrative tracker-narrative-secondary">
                  <h3>Other escalation detail</h3>
                  <p>{caseData.presidentialEscalationOtherDetail}</p>
                </div>
              ) : null}
            </article>

            <article className="tracker-panel tracker-panel-wide">
              <div className="tracker-panel-head">
                <div>
                  <p className="eyebrow">Secure updates</p>
                  <h2>Activity timeline</h2>
                </div>
                <span className="tracker-session-tag">
                  End-to-end protected
                </span>
              </div>

              <div className="tracker-timeline">
                {caseData.activity.map((event) => (
                  <article className="tracker-timeline-entry" key={`${event.createdAt}-${event.summary}`}>
                    <div className="tracker-timeline-marker" />
                    <div className="tracker-timeline-body">
                      <p className="tracker-timeline-meta">
                        {formatActor(event.actorType)} · {formatDateTime(event.createdAt)}
                      </p>
                      <p>{event.summary}</p>
                    </div>
                  </article>
                ))}
              </div>

              <p className="tracker-note">
                Messaging can be added next once the Dataverse message table is
                enabled. This view is already wired to the live case and audit
                records.
              </p>
            </article>
          </section>
        ) : null}
      </main>
    </>
  );
}

function formatActor(actorType: string) {
  if (actorType === "reporter") {
    return "Reporter activity";
  }

  if (actorType === "investigator") {
    return "Investigator activity";
  }

  return actorType.replace(/_/g, " ");
}

function formatDateTime(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
}

function formatProgressDescription(step: (typeof progressSteps)[number]) {
  if (step === "received") {
    return "Your submission has been recorded.";
  }

  if (step === "investigation") {
    return "The case is currently under review.";
  }

  return "A final action or resolution has been recorded.";
}

function formatProgressLabel(step: (typeof progressSteps)[number]) {
  if (step === "action_taken") {
    return "Action taken";
  }

  return step.charAt(0).toUpperCase() + step.slice(1);
}

function getActiveStep(status: ReporterCaseAccessResponse["status"] | undefined) {
  if (!status || status === "new" || status === "triage") {
    return 0;
  }

  if (status === "investigating" || status === "waiting_for_reporter") {
    return 1;
  }

  return 2;
}

function formatBooleanLabel(value: boolean) {
  return value ? "Yes" : "No";
}
