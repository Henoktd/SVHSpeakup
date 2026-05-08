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
  potentialImpactLabels,
  potentialImpactValues,
  presidentialEscalationFactorLabels,
  presidentialEscalationFactorValues,
  urgencyLabels,
  urgencyValues
} from "@svh/types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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

export function ReportPage() {
  const navigate = useNavigate();
  const [categoryOptions, setCategoryOptions] = useState<ReportCategoryOption[]>(
    []
  );
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
            ? "No report categories are currently available from Dataverse."
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
              : "Unable to load report categories from Dataverse."
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
      const payload = createReportSchema.parse(values);
      const result = await createReport(payload);

      navigate("/confirmation", {
        state: result
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit report."
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
          <Link to="/">Home page</Link>
          <a href="#report-form">New report</a>
        </nav>
      </header>

      <main className="shell narrow report-shell">
        <section className="report-intro">
          <p className="eyebrow">Anonymous submission</p>
          <h1>New report</h1>
          <p className="lede centered-copy">
            Submit a concern relating to SVH or one of its ventures. Your
            report is treated as confidential and can be followed up later with
            your case ID and secret.
          </p>
        </section>

        <form
          className="form-card form-card-faceup"
          id="report-form"
          onSubmit={handleFormSubmit}
        >
          <div className="form-stepper" aria-label="Report submission steps">
            <div
              className={`form-step-card${currentStep === 1 ? " active" : ""}${
                currentStep > 1 ? " complete" : ""
              }`}
            >
              <span className="form-step-index">1</span>
              <div>
                <strong>Report details</strong>
                <p>Share what happened and where.</p>
              </div>
            </div>
            <div className={`form-step-card${currentStep === 2 ? " active" : ""}`}>
              <span className="form-step-index">2</span>
              <div>
                <strong>Escalation &amp; submit</strong>
                <p>Add urgency context and confirm submission.</p>
              </div>
            </div>
          </div>

          {currentStep === 1 ? (
            <>
              <section className="form-step-panel">
                <div className="section-head-inline">
                  <p className="eyebrow">Step 1 of 2</p>
                  <h2>Report details</h2>
                  <p className="step-copy">
                    Start with the core facts so investigators can understand
                    the concern before they review escalation context.
                  </p>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>Category</span>
                    <select
                      disabled={isLoadingOptions || categoryOptions.length === 0}
                      {...form.register("category")}
                    >
                      <option disabled value="">
                        {isLoadingOptions
                          ? "Loading categories..."
                          : "Select a category"}
                      </option>
                      {categoryOptions.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={form.formState.errors.category?.message} />
                  </label>

                  <label className="field field-span-2">
                    <span>Title</span>
                    <input
                      placeholder="Short summary of the concern"
                      {...form.register("title")}
                    />
                    <FieldError message={form.formState.errors.title?.message} />
                  </label>

                  <label className="field field-span-2">
                    <span>Description</span>
                    <textarea
                      rows={7}
                      placeholder="Describe what happened as concisely as you can. Investigators can follow up later."
                      {...form.register("description")}
                    />
                    <FieldError
                      message={form.formState.errors.description?.message}
                    />
                  </label>

                  <label className="field">
                    <span>When did it happen?</span>
                    <input
                      placeholder="For example: 2026-05-01 or 1 May 2026"
                      {...form.register("incidentDateText")}
                    />
                    <FieldError
                      message={form.formState.errors.incidentDateText?.message}
                    />
                  </label>

                  <label className="field">
                    <span>Where did it happen?</span>
                    <input
                      placeholder="For example: Nairobi office"
                      {...form.register("locationText")}
                    />
                    <FieldError
                      message={form.formState.errors.locationText?.message}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>People involved</span>
                    <textarea
                      rows={3}
                      placeholder="Optional names, roles, or descriptors"
                      {...form.register("peopleInvolved")}
                    />
                  </label>

                  <label className="field field-span-2">
                    <span>Evidence notes</span>
                    <textarea
                      rows={3}
                      placeholder="Optional notes about files, screenshots, or witnesses"
                      {...form.register("evidenceNotes")}
                    />
                  </label>
                </div>
              </section>

              {optionsError ? <p className="error-banner">{optionsError}</p> : null}

              <div className="submit-row step-actions">
                <div className="step-actions-copy">
                  Continue to add escalation and urgency details.
                </div>
                <button
                  className="button primary"
                  disabled={isLoadingOptions || categoryOptions.length === 0}
                  type="submit"
                >
                  Next step
                </button>
              </div>
            </>
          ) : (
            <>
              <section className="form-step-panel">
                <div className="section-head-inline">
                  <p className="eyebrow">Step 2 of 2</p>
                  <h2>Escalation, impact, and submit</h2>
                  <p className="step-copy">
                    Clarify why this needs higher attention, then confirm the
                    confidentiality and good-faith statements before sending.
                  </p>
                </div>

                <section className="form-section form-section-first">
                  <div className="section-head-inline">
                    <p className="eyebrow">Escalation</p>
                    <h2>Justification for Presidential Escalation</h2>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Has this issue been raised through normal channels?</span>
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
                        <option value="">Select yes or no</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                      <FieldError
                        message={
                          form.formState.errors.raisedThroughNormalChannels
                            ?.message
                        }
                      />
                    </label>

                    <label className="field field-span-2">
                      <span>
                        Why should this be escalated directly to the President?
                      </span>
                      <textarea
                        maxLength={100}
                        rows={4}
                        placeholder="Explain why direct presidential escalation is necessary."
                        {...form.register("presidentialEscalationReason")}
                      />
                      <FieldError
                        message={
                          form.formState.errors.presidentialEscalationReason
                            ?.message
                        }
                      />
                    </label>

                    {raisedThroughNormalChannels === true ? (
                      <label className="field field-span-2">
                        <span>If yes, what action was taken or not taken?</span>
                        <textarea
                          maxLength={100}
                          rows={3}
                          placeholder="Summarize what happened after raising it locally."
                          {...form.register("normalChannelActionSummary")}
                        />
                        <FieldError
                          message={
                            form.formState.errors.normalChannelActionSummary
                              ?.message
                          }
                        />
                      </label>
                    ) : null}

                    <div className="field field-span-2">
                      <span>Select all that apply</span>
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
                              {presidentialEscalationFactorLabels[factor]}
                            </span>
                          </label>
                        ))}
                      </div>
                      <FieldError
                        message={
                          form.formState.errors.presidentialEscalationFactors
                            ?.message
                        }
                      />
                    </div>

                    {selectedEscalationFactors.includes("other") ? (
                      <label className="field field-span-2">
                        <span>Other detail</span>
                        <textarea
                          maxLength={100}
                          rows={3}
                          placeholder="Describe the other factor that applies."
                          {...form.register("presidentialEscalationOtherDetail")}
                        />
                        <FieldError
                          message={
                            form.formState.errors
                              .presidentialEscalationOtherDetail?.message
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                </section>

                <section className="form-section">
                  <div className="section-head-inline">
                    <p className="eyebrow">Impact</p>
                    <h2>Impact &amp; Urgency</h2>
                  </div>

                  <div className="form-grid">
                    <label className="field">
                      <span>Potential impact if not addressed</span>
                      <select {...form.register("potentialImpact")}>
                        <option value="">Select impact level</option>
                        {potentialImpactValues.map((impact) => (
                          <option key={impact} value={impact}>
                            {potentialImpactLabels[impact]}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        message={form.formState.errors.potentialImpact?.message}
                      />
                    </label>

                    <label className="field">
                      <span>Urgency</span>
                      <select {...form.register("urgency")}>
                        <option value="">Select urgency</option>
                        {urgencyValues.map((urgency) => (
                          <option key={urgency} value={urgency}>
                            {urgencyLabels[urgency]}
                          </option>
                        ))}
                      </select>
                      <FieldError message={form.formState.errors.urgency?.message} />
                    </label>
                  </div>
                </section>

                <div className="notice-block">
                  <h2>Confidentiality note</h2>
                  <p>
                    Avoid sharing details that would reveal your identity unless
                    you want investigators to have that information.
                  </p>
                </div>

                <label className="checkbox">
                  <input
                    type="checkbox"
                    {...form.register("confidentialityAccepted")}
                  />
                  <span>I understand how confidentiality works in this portal.</span>
                </label>
                <FieldError
                  message={form.formState.errors.confidentialityAccepted?.message}
                />

                <label className="checkbox">
                  <input type="checkbox" {...form.register("consentAccepted")} />
                  <span>I confirm that this report is submitted in good faith.</span>
                </label>
                <FieldError
                  message={form.formState.errors.consentAccepted?.message}
                />
              </section>

              {submitError ? <p className="error-banner">{submitError}</p> : null}

              <div className="submit-row step-actions">
                <button
                  className="button secondary"
                  onClick={goBackToDetailsStep}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="button primary"
                  disabled={form.formState.isSubmitting}
                  type="submit"
                >
                  {form.formState.isSubmitting ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="field-error">{message}</p>;
}
