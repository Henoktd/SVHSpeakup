import { useState } from "react";
import type { CreateReportResponse } from "@svh/types";
import { Link, useLocation } from "react-router-dom";
import { saveReporterEmail } from "../lib/api";

export function ConfirmationPage() {
  const location = useLocation();
  const result = location.state as CreateReportResponse | null;
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  async function handleSaveEmail() {
    if (!result) {
      return;
    }

    setEmailError(null);
    setIsSavingEmail(true);

    try {
      await saveReporterEmail({
        caseId: result.caseId,
        reporterEmail: email
      });
      setEmailSaved(true);
    } catch (error) {
      setEmailError(
        error instanceof Error ? error.message : "Unable to save email."
      );
    } finally {
      setIsSavingEmail(false);
    }
  }

  return (
    <main className="shell narrow">
      <section className="confirmation-card">
        <p className="eyebrow">Report received</p>
        <h1>Your case has been created.</h1>
        <p className="lede">
          Keep these details somewhere safe. They are the only way to access
          your anonymous case later.
        </p>

        {result ? (
          <>
            <dl className="credential-list">
              <div>
                <dt>Case ID</dt>
                <dd>{result.caseId}</dd>
              </div>
              <div>
                <dt>Secret</dt>
                <dd>{result.secret}</dd>
              </div>
              <div>
                <dt>Submitted at</dt>
                <dd>{new Date(result.submittedAt).toLocaleString()}</dd>
              </div>
            </dl>

            <div className="email-capture-card">
              <label className="email-toggle-line">
                <span>Receive updates about your report by email</span>
              </label>
              <div className="email-capture-row">
                <input
                  className="email-capture-input"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email"
                  type="email"
                  value={email}
                />
                <button
                  className="button primary"
                  disabled={!email || isSavingEmail || emailSaved}
                  onClick={handleSaveEmail}
                  type="button"
                >
                  {emailSaved ? "Saved" : isSavingEmail ? "Saving..." : "Save"}
                </button>
              </div>
              {emailError ? <p className="field-error">{emailError}</p> : null}
            </div>
          </>
        ) : (
          <p className="error-banner">
            No submission details were found in this session. Once the backend
            is connected, this page should be reached from a successful form
            submission.
          </p>
        )}

        <div className="actions">
          <Link className="button primary" to="/report">
            Submit another report
          </Link>
          <Link className="button secondary" to="/">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
