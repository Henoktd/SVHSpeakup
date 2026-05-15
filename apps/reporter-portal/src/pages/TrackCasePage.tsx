import { useEffect, useState } from "react";
import type { ReporterCaseAccessResponse } from "@svh/types";
import { Link, useLocation } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { ReporterEmailCaptureCard } from "../components/ReporterEmailCaptureCard";
import { useLanguage } from "../i18n";
import { accessReporterCase } from "../lib/api";

interface TrackCaseLocationState {
  caseId?: string;
  secret?: string;
}

const progressSteps = ["received", "investigation", "action_taken"] as const;

export function TrackCasePage() {
  const location = useLocation();
  const { t, translateCategoryLabel } = useLanguage();
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
          : t("track.error")
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
          <Link to="/report">{t("nav.newReport")}</Link>
          <Link to="/track">{t("nav.track")}</Link>
          <LanguageToggle />
        </nav>
      </header>

      <main className="shell narrow tracker-shell">
        <section className="tracker-hero">
          <p className="eyebrow">{t("track.eyebrow")}</p>
          <h1>{t("track.title")}</h1>
          <p className="lede centered-copy">
            {t("track.lede")}
          </p>
        </section>

        <section className="tracker-access-card">
          <div className="tracker-access-grid">
            <label className="field">
              <span>{t("track.caseId")}</span>
              <input
                onChange={(event) => setCaseId(event.target.value)}
                placeholder="SVH-2026-000124"
                value={caseId}
              />
            </label>
            <label className="field">
              <span>{t("track.secret")}</span>
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
              {isLoading ? t("track.opening") : t("track.access")}
            </button>
          </div>
          {error ? <p className="error-banner">{error}</p> : null}
        </section>

        {caseData ? (
          <section className="tracker-layout">
            <article className="tracker-panel">
              <div className="tracker-badges">
                <span className="tracker-badge">
                  {t("track.badgeCase", { caseId: caseData.caseId })}
                </span>
                <span className="tracker-badge muted">{caseData.statusLabel}</span>
              </div>

              <h2>{t("track.submissionTracking")}</h2>
              <p className="lede">
                {t("track.workflowCopy")}
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
                        <strong>{formatProgressLabel(step, t)}</strong>
                        <p>{formatProgressDescription(step, t)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="tracker-panel">
              <h2>{t("track.summary")}</h2>
              <dl className="tracker-summary-grid">
                <div>
                  <dt>{t("track.category")}</dt>
                  <dd>{translateCategoryLabel(caseData.categoryLabel)}</dd>
                </div>
                <div>
                  <dt>{t("track.submitted")}</dt>
                  <dd>{formatDateTime(caseData.submittedAt)}</dd>
                </div>
                <div>
                  <dt>{t("track.lastActivity")}</dt>
                  <dd>{formatDateTime(caseData.lastActivityAt)}</dd>
                </div>
                <div>
                  <dt>{t("track.emailUpdates")}</dt>
                  <dd>{caseData.reporterEmail ?? t("track.notAdded")}</dd>
                </div>
              </dl>

              <ReporterEmailCaptureCard
                caseId={caseData.caseId}
                description={t("track.emailDescription")}
                initialEmail={caseData.reporterEmail}
                onSaved={(email) =>
                  setCaseData((currentCaseData) =>
                    currentCaseData
                      ? {
                          ...currentCaseData,
                          reporterEmail: email
                        }
                      : currentCaseData
                  )
                }
                secret={secret}
                title={t("track.emailTitle")}
              />

              <div className="tracker-narrative">
                <h3>{caseData.title}</h3>
                <p>{caseData.description}</p>
              </div>

              <div className="tracker-detail-grid">
                <div>
                  <span>{t("track.incidentDate")}</span>
                  <strong>
                    {caseData.incidentDateText
                      ? formatDateTime(caseData.incidentDateText)
                      : t("track.notProvided")}
                  </strong>
                </div>
                <div>
                  <span>{t("track.location")}</span>
                  <strong>{caseData.locationText || t("track.notProvided")}</strong>
                </div>
                <div>
                  <span>{t("track.people")}</span>
                  <strong>{caseData.peopleInvolved || t("track.notProvided")}</strong>
                </div>
                <div>
                  <span>{t("track.evidence")}</span>
                  <strong>{caseData.evidenceNotes || t("track.notProvided")}</strong>
                </div>
              </div>

              <section className="tracker-narrative tracker-narrative-secondary">
                <h3>{t("track.escalationContext")}</h3>
                <p>{caseData.presidentialEscalationReason}</p>
              </section>

              <div className="tracker-detail-grid">
                <div>
                  <span>{t("track.raisedChannels")}</span>
                  <strong>
                    {formatBooleanLabel(caseData.raisedThroughNormalChannels, t)}
                  </strong>
                </div>
                <div>
                  <span>{t("track.potentialImpact")}</span>
                  <strong>{caseData.potentialImpactLabel || t("track.notProvided")}</strong>
                </div>
                <div>
                  <span>{t("track.urgency")}</span>
                  <strong>{caseData.urgencyLabel || t("track.notProvided")}</strong>
                </div>
                <div>
                  <span>{t("track.localAction")}</span>
                  <strong>
                    {caseData.normalChannelActionSummary || t("track.notProvided")}
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
                  <h3>{t("track.otherDetail")}</h3>
                  <p>{caseData.presidentialEscalationOtherDetail}</p>
                </div>
              ) : null}
            </article>

            <article className="tracker-panel tracker-panel-wide">
              <div className="tracker-panel-head">
                <div>
                  <p className="eyebrow">{t("track.updatesEyebrow")}</p>
                  <h2>{t("track.timeline")}</h2>
                </div>
                <span className="tracker-session-tag">
                  {t("track.protected")}
                </span>
              </div>

              <div className="tracker-timeline">
                {caseData.activity.map((event) => (
                  <article className="tracker-timeline-entry" key={`${event.createdAt}-${event.summary}`}>
                    <div className="tracker-timeline-marker" />
                    <div className="tracker-timeline-body">
                      <p className="tracker-timeline-meta">
                        {formatActor(event.actorType, t)} · {formatDateTime(event.createdAt)}
                      </p>
                      <p>{event.summary}</p>
                    </div>
                  </article>
                ))}
              </div>

              <p className="tracker-note">
                {t("track.note")}
              </p>
            </article>
          </section>
        ) : null}
      </main>
    </>
  );
}

function formatActor(actorType: string, t: ReturnType<typeof useLanguage>["t"]) {
  if (actorType === "reporter") {
    return t("actor.reporter");
  }

  if (actorType === "investigator") {
    return t("actor.investigator");
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

function formatProgressDescription(
  step: (typeof progressSteps)[number],
  t: ReturnType<typeof useLanguage>["t"]
) {
  if (step === "received") {
    return t("progress.received.description");
  }

  if (step === "investigation") {
    return t("progress.investigation.description");
  }

  return t("progress.action.description");
}

function formatProgressLabel(
  step: (typeof progressSteps)[number],
  t: ReturnType<typeof useLanguage>["t"]
) {
  if (step === "received") {
    return t("progress.received.label");
  }

  if (step === "investigation") {
    return t("progress.investigation.label");
  }

  if (step === "action_taken") {
    return t("progress.action.label");
  }

  return t("progress.action.label");
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

function formatBooleanLabel(
  value: boolean,
  t: ReturnType<typeof useLanguage>["t"]
) {
  return value ? t("common.yes") : t("common.no");
}
