import type { CreateReportResponse } from "@svh/types";
import { Link, useLocation } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { ReporterEmailCaptureCard } from "../components/ReporterEmailCaptureCard";
import { useLanguage } from "../i18n";

export function ConfirmationPage() {
  const location = useLocation();
  const result = location.state as CreateReportResponse | null;
  const { t } = useLanguage();

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

      <main className="shell narrow">
        <section className="confirmation-card">
        <p className="eyebrow">{t("confirmation.eyebrow")}</p>
        <h1>{t("confirmation.title")}</h1>
        <p className="lede">
          {t("confirmation.lede")}
        </p>

        {result ? (
          <>
            <dl className="credential-list">
              <div>
                <dt>{t("confirmation.caseId")}</dt>
                <dd>{result.caseId}</dd>
              </div>
              <div>
                <dt>{t("confirmation.secret")}</dt>
                <dd>{result.secret}</dd>
              </div>
              <div>
                <dt>{t("confirmation.submittedAt")}</dt>
                <dd>{new Date(result.submittedAt).toLocaleString()}</dd>
              </div>
            </dl>

            <ReporterEmailCaptureCard
              caseId={result.caseId}
              description={t("confirmation.emailDescription")}
              secret={result.secret}
              title={t("confirmation.emailTitle")}
            />
          </>
        ) : (
          <p className="error-banner">
            {t("confirmation.missing")}
          </p>
        )}

        <div className="actions">
          {result ? (
            <Link
              className="button secondary"
              state={{ caseId: result.caseId, secret: result.secret }}
              to="/track"
            >
              {t("confirmation.track")}
            </Link>
          ) : null}
          <Link className="button primary" to="/report">
            {t("confirmation.submitAnother")}
          </Link>
          <Link className="button secondary" to="/">
            {t("confirmation.home")}
          </Link>
        </div>
        </section>
      </main>
    </>
  );
}
