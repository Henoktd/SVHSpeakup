import { zodResolver } from "@hookform/resolvers/zod";
import type {
  CreateReportRequest,
  PotentialImpact,
  PresidentialEscalationFactor,
  ReportCategoryOption,
  UrgencyLevel
} from "@svh/types";
import {
  createReportSchema,
  potentialImpactValues,
  presidentialEscalationFactorValues,
  urgencyValues
} from "@svh/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { useLanguage } from "../i18n";
import { createReport, getReporterFormOptions } from "../lib/api";

type ReportFormValues = Omit<
  CreateReportRequest,
  "confidentialityAccepted" | "consentAccepted"
> & {
  confidentialityAccepted: boolean;
  consentAccepted: boolean;
  potentialImpact?: PotentialImpact;
  raisedThroughNormalChannels?: boolean;
  urgency?: UrgencyLevel;
};

const reportDetailsFields: Array<keyof ReportFormValues> = [
  "category",
  "title",
  "description",
  "incidentDateText",
  "locationText",
  "peopleInvolved",
  "evidenceNotes"
];

const maxEvidenceFiles = 5;
const maxEvidenceFileSizeBytes = 10 * 1024 * 1024;

export function ReportPage() {
  const navigate = useNavigate();
  const {
    t,
    translateCategoryLabel,
    translateEscalationFactor,
    translatePotentialImpact,
    translateUrgency,
    translateError
  } = useLanguage();
  const [categoryOptions, setCategoryOptions] = useState<ReportCategoryOption[]>(
    []
  );
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      incidentDateText: "",
      locationText: "",
      peopleInvolved: "",
      evidenceNotes: "",
      normalChannelActionSummary: "",
      presidentialEscalationReason: "",
      presidentialEscalationFactors: [],
      presidentialEscalationOtherDetail: "",
      confidentialityAccepted: false,
      consentAccepted: false
    }
  });
  const { getValues, setValue, watch } = form;
  const raisedThroughNormalChannels = watch("raisedThroughNormalChannels");
  const selectedEscalationFactors =
    watch("presidentialEscalationFactors") ?? [];

  useEffect(() => {
    if (raisedThroughNormalChannels === true) {
      return;
    }

    setValue("normalChannelActionSummary", "", {
      shouldDirty: false,
      shouldValidate: false
    });
  }, [raisedThroughNormalChannels, setValue]);

  useEffect(() => {
    if (selectedEscalationFactors.includes("other")) {
      return;
    }

    setValue("presidentialEscalationOtherDetail", "", {
      shouldDirty: false,
      shouldValidate: false
    });
  }, [selectedEscalationFactors, setValue]);

  useEffect(() => {
    let isCancelled = false;

    async function loadReporterFormOptions() {
      try {
        const result = await getReporterFormOptions();

        if (isCancelled) {
          return;
        }

        setCategoryOptions(result.categories);
        setOptionsError(
          result.categories.length === 0
            ? t("report.optionsEmpty")
            : null
        );

        const currentCategory = getValues("category");
        const hasCurrentCategory = result.categories.some(
          (category) => category.value === currentCategory
        );

        if (!hasCurrentCategory && result.categories.length > 0) {
          setValue("category", result.categories[0].value, {
            shouldDirty: false,
            shouldValidate: true
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setOptionsError(
            error instanceof Error
              ? error.message
              : t("report.optionsError")
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingOptions(false);
        }
      }
    }

    void loadReporterFormOptions();

    return () => {
      isCancelled = true;
    };
  }, [getValues, setValue]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const payload = createReportSchema.parse({
        ...values,
        presidentialEscalationReason:
          buildPresidentialEscalationReason(values),
        presidentialEscalationOtherDetail: ""
      });
      const result = await createReport(payload, evidenceFiles);

      navigate("/confirmation", {
        state: result
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t("report.submitError")
      );
    }
  });

  function toggleEscalationFactor(factor: PresidentialEscalationFactor) {
    const currentFactors = form.getValues("presidentialEscalationFactors") ?? [];
    const nextFactors = currentFactors.includes(factor)
      ? currentFactors.filter((currentFactor) => currentFactor !== factor)
      : [...currentFactors, factor];

    setValue("presidentialEscalationFactors", nextFactors, {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  function handleEvidenceFilesChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    const acceptedFiles = selectedFiles
      .filter((file) => file.size <= maxEvidenceFileSizeBytes)
      .slice(0, maxEvidenceFiles);

    setEvidenceFiles(acceptedFiles);

    if (selectedFiles.length > maxEvidenceFiles) {
      setEvidenceError(
        t("report.evidenceTooMany", { count: maxEvidenceFiles })
      );
      return;
    }

    if (selectedFiles.some((file) => file.size > maxEvidenceFileSizeBytes)) {
      setEvidenceError(t("report.evidenceTooLarge"));
      return;
    }

    setEvidenceError(null);
  }

  async function goToEscalationStep() {
    setSubmitError(null);

    const isStepValid = await form.trigger(reportDetailsFields, {
      shouldFocus: true
    });

    if (!isStepValid) {
      return;
    }

    setCurrentStep(2);
    document.getElementById("report-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function goBackToDetailsStep() {
    setCurrentStep(1);
    document.getElementById("report-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (currentStep === 1) {
      event.preventDefault();
      void goToEscalationStep();
      return;
    }

    void onSubmit(event);
  }

  return (
    <>
      <header className="topbar shell narrow">
        <Link className="brand-lockup compact" to="/">
          <img alt="Solstice Ventures Holding" src="/brand/svh-logo-horizontal.png" />
        </Link>

        <nav className="topnav">
          <Link to="/">{t("nav.home")}</Link>
          <a href="#report-form">{t("nav.newReport")}</a>
          <LanguageToggle />
        </nav>
      </header>

      <main className="shell narrow report-shell">
        <section className="report-intro">
          <p className="eyebrow">{t("report.eyebrow")}</p>
          <h1>{t("report.title")}</h1>
          <p className="lede centered-copy">
            {t("report.lede")}
          </p>
        </section>

        <form
          className="form-card form-card-faceup"
          id="report-form"
          onSubmit={handleFormSubmit}
        >
          <div className="form-stepper" aria-label={t("report.steps.aria")}>
            <div
              className={`form-step-card${currentStep === 1 ? " active" : ""}${
                currentStep > 1 ? " complete" : ""
              }`}
            >
              <span className="form-step-index">1</span>
              <div>
                <strong>{t("report.step1.title")}</strong>
                <p>{t("report.step1.copy")}</p>
              </div>
            </div>
            <div className={`form-step-card${currentStep === 2 ? " active" : ""}`}>
              <span className="form-step-index">2</span>
              <div>
                <strong>{t("report.step2.title")}</strong>
                <p>{t("report.step2.copy")}</p>
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            <>
              <section className="form-step-panel">
                <div className="section-head-inline">
                  <p className="eyebrow">{t("report.step1.eyebrow")}</p>
                  <h2>{t("report.step1.heading")}</h2>
                  <p className="step-copy">
                    {t("report.step1.help")}
                  </p>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>{t("report.category")}</span>
                    <select
                      disabled={isLoadingOptions || categoryOptions.length === 0}
                      {...form.register("category")}
                    >
                      <option disabled value="">
                        {isLoadingOptions
                          ? t("report.loadingCategories")
                          : t("report.selectCategory")}
                      </option>
                      {categoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {translateCategoryLabel(category.label)}
                        </option>
                      ))}
                    </select>
                    <FieldError
                      message={translateError(form.formState.errors.category?.message)}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>{t("report.titleField")}</span>
                    <input
                      placeholder={t("report.titlePlaceholder")}
                      {...form.register("title")}
                    />
                    <p className="field-hint">{t("report.titleHint")}</p>
                    <FieldError
                      message={translateError(form.formState.errors.title?.message)}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>{t("report.description")}</span>
                    <textarea
                      rows={7}
                      placeholder={t("report.descriptionPlaceholder")}
                      {...form.register("description")}
                    />
                    <p className="field-hint">{t("report.descriptionHint")}</p>
                    <FieldError
                      message={translateError(form.formState.errors.description?.message)}
                    />
                  </label>

                  <label className="field">
                    <span>{t("report.when")}</span>
                    <input
                      type="datetime-local"
                      {...form.register("incidentDateText")}
                    />
                    <FieldError
                      message={translateError(form.formState.errors.incidentDateText?.message)}
                    />
                  </label>

                  <label className="field">
                    <span>{t("report.where")}</span>
                    <input
                      placeholder={t("report.wherePlaceholder")}
                      {...form.register("locationText")}
                    />
                    <FieldError
                      message={translateError(form.formState.errors.locationText?.message)}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>{t("report.people")}</span>
                    <textarea
                      rows={3}
                      placeholder={t("report.peoplePlaceholder")}
                      {...form.register("peopleInvolved")}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>{t("report.evidenceNotes")}</span>
                    <textarea
                      rows={3}
                      placeholder={t("report.evidenceNotesPlaceholder")}
                      {...form.register("evidenceNotes")}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>{t("report.evidenceFiles")}</span>
                    <input
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt,.eml,.msg,image/*,application/pdf"
                      multiple
                      onChange={handleEvidenceFilesChange}
                      type="file"
                    />
                    <p className="field-hint">
                      {t("report.evidenceHint", { count: maxEvidenceFiles })}
                    </p>
                    {evidenceFiles.length > 0 ? (
                      <ul className="file-list">
                        {evidenceFiles.map((file) => (
                          <li key={`${file.name}-${file.lastModified}`}>
                            <span>{file.name}</span>
                            <span>{formatFileSize(file.size)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <FieldError message={evidenceError ?? undefined} />
                  </label>
                </div>
              </section>

              {optionsError ? <p className="error-banner">{optionsError}</p> : null}

              <div className="submit-row step-actions">
                <div className="step-actions-copy">
                  {t("report.continueCopy")}
                </div>
                <button
                  className="button primary"
                  disabled={isLoadingOptions || categoryOptions.length === 0}
                  type="submit"
                >
                  {t("report.next")}
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="form-step-panel">
                <div className="section-head-inline">
                  <p className="eyebrow">{t("report.step2.eyebrow")}</p>
                  <h2>{t("report.step2.heading")}</h2>
                  <p className="step-copy">
                    {t("report.step2.help")}
                  </p>
                </div>

                <section className="form-section form-section-first">
                  <div className="section-head-inline">
                    <p className="eyebrow">{t("report.escalation.eyebrow")}</p>
                    <h2>{t("report.escalation.heading")}</h2>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>{t("report.raisedChannels")}</span>
                      <select
                        {...form.register("raisedThroughNormalChannels", {
                          setValueAs: (value) =>
                            value === "true"
                              ? true
                              : value === "false"
                                ? false
                                : undefined
                        })}
                      >
                        <option value="">{t("report.selectYesNo")}</option>
                        <option value="true">{t("report.yes")}</option>
                        <option value="false">{t("report.no")}</option>
                      </select>
                      <FieldError
                        message={
                          translateError(
                            form.formState.errors.raisedThroughNormalChannels
                              ?.message
                          )
                        }
                      />
                    </label>

                    {raisedThroughNormalChannels === true ? (
                      <label className="field field-span-2">
                        <span>{t("report.localAction")}</span>
                        <textarea
                          maxLength={100}
                          rows={3}
                          placeholder={t("report.localActionPlaceholder")}
                          {...form.register("normalChannelActionSummary")}
                        />
                        <FieldError
                          message={
                            translateError(
                              form.formState.errors.normalChannelActionSummary
                                ?.message
                            )
                          }
                        />
                      </label>
                    ) : null}

                    <div className="field field-span-2">
                      <span>
                        {t("report.escalationReason")}
                      </span>
                      <div className="checkbox-card-grid">
                        {presidentialEscalationFactorValues.map((factor) => (
                          <label
                            className={`checkbox-card${
                              selectedEscalationFactors.includes(factor)
                                ? " checked"
                                : ""
                            }`}
                            key={factor}
                          >
                            <input
                              checked={selectedEscalationFactors.includes(factor)}
                              onChange={() => toggleEscalationFactor(factor)}
                              type="checkbox"
                            />
                            <span className="checkbox-card-label">
                              {translateEscalationFactor(factor)}
                            </span>
                          </label>
                        ))}
                      </div>
                      <FieldError
                        message={
                          translateError(
                            form.formState.errors.presidentialEscalationFactors
                              ?.message
                          )
                        }
                      />
                    </div>

                  </div>
                </section>

                <section className="form-section">
                  <div className="section-head-inline">
                    <p className="eyebrow">{t("report.impact.eyebrow")}</p>
                    <h2>{t("report.impact.heading")}</h2>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>{t("report.potentialImpact")}</span>
                      <select {...form.register("potentialImpact")}>
                        <option value="">{t("report.selectImpact")}</option>
                        {potentialImpactValues.map((impact) => (
                          <option key={impact} value={impact}>
                            {translatePotentialImpact(impact)}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        message={translateError(
                          form.formState.errors.potentialImpact?.message
                        )}
                      />
                    </label>

                    <label className="field">
                      <span>{t("report.urgency")}</span>
                      <select {...form.register("urgency")}>
                        <option value="">{t("report.selectUrgency")}</option>
                        {urgencyValues.map((urgency) => (
                          <option key={urgency} value={urgency}>
                            {translateUrgency(urgency)}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        message={translateError(form.formState.errors.urgency?.message)}
                      />
                    </label>
                  </div>
                </section>

                <div className="notice-block">
                  <h2>{t("report.confidentiality.heading")}</h2>
                  <p>
                    {t("report.confidentiality.copy")}
                  </p>
                </div>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    {...form.register("confidentialityAccepted")}
                  />
                  <span>{t("report.confidentiality.accept")}</span>
                </label>
                <FieldError
                  message={translateError(
                    form.formState.errors.confidentialityAccepted?.message
                  )}
                />

                <label className="checkbox">
                  <input type="checkbox" {...form.register("consentAccepted")} />
                  <span>{t("report.consent.accept")}</span>
                </label>
                <FieldError
                  message={translateError(
                    form.formState.errors.consentAccepted?.message
                  )}
                />
              </section>

              {submitError ? <p className="error-banner">{submitError}</p> : null}

              <div className="submit-row step-actions">
                <button
                  className="button secondary"
                  onClick={goBackToDetailsStep}
                  type="button"
                >
                  {t("report.back")}
                </button>
                <button
                  className="button primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting
                    ? t("report.submitting")
                    : t("report.submit")}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </>
  );
}

function buildPresidentialEscalationReason(values: ReportFormValues) {
  const selectedFactors = values.presidentialEscalationFactors ?? [];

  if (selectedFactors.length === 0) {
    return "";
  }

  return "See selected escalation factors.";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="field-error">{message}</p>;
}
