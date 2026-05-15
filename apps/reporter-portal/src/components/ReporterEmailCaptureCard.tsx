import { useEffect, useState } from "react";
import type { SaveReporterEmailResponse } from "@svh/types";
import { useLanguage } from "../i18n";
import { saveReporterEmail } from "../lib/api";

interface ReporterEmailCaptureCardProps {
  caseId: string;
  secret: string;
  initialEmail?: string | null;
  onSaved?: (email: string) => void;
  title: string;
  description: string;
}

export function ReporterEmailCaptureCard({
  caseId,
  secret,
  initialEmail,
  onSaved,
  title,
  description
}: ReporterEmailCaptureCardProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [lastSavedEmail, setLastSavedEmail] = useState(initialEmail ?? "");
  const [emailResult, setEmailResult] = useState<SaveReporterEmailResponse | null>(
    null
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    const nextEmail = initialEmail ?? "";

    setEmail(nextEmail);
    setLastSavedEmail(nextEmail);
    setEmailResult(null);
    setEmailError(null);
    setIsSavingEmail(false);
  }, [caseId, initialEmail, secret]);

  const normalizedEmail = email.trim();
  const hasPendingChange = normalizedEmail !== lastSavedEmail.trim();

  async function handleSaveEmail() {
    setEmailError(null);
    setIsSavingEmail(true);

    try {
      const saveResult = await saveReporterEmail({
        caseId,
        secret,
        reporterEmail: normalizedEmail
      });

      setLastSavedEmail(normalizedEmail);
      setEmailResult(saveResult);
      onSaved?.(normalizedEmail);
    } catch (error) {
      setEmailResult(null);
      setEmailError(
        error instanceof Error ? error.message : t("email.error")
      );
    } finally {
      setIsSavingEmail(false);
    }
  }

  return (
    <div className="email-capture-card">
      <label className="email-toggle-line">
        <span>{title}</span>
      </label>
      <p className="support-copy">{description}</p>
      <div className="email-capture-row">
        <input
          className="email-capture-input"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("email.placeholder")}
          type="email"
          value={email}
        />
        <button
          className="button primary"
          disabled={!normalizedEmail || isSavingEmail || !hasPendingChange}
          onClick={handleSaveEmail}
          type="button"
        >
          {isSavingEmail
            ? t("email.saving")
            : lastSavedEmail
              ? t("email.update")
              : t("email.save")}
        </button>
      </div>
      {emailResult ? (
        <p className="support-copy">
          {emailResult.deliveryMode === "ethereal" ? (
            <>
              {t("email.ethereal")}
              {emailResult.previewUrl ? (
                <>
                  {" "}
                  <a href={emailResult.previewUrl} rel="noreferrer" target="_blank">
                    {t("email.openPreview")}
                  </a>
                  .
                </>
              ) : null}
            </>
          ) : emailResult.emailed ? (
            t("email.sent")
          ) : (
            t("email.notConfigured")
          )}
        </p>
      ) : null}
      {emailError ? <p className="field-error">{emailError}</p> : null}
    </div>
  );
}
