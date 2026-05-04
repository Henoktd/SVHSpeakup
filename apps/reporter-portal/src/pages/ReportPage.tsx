import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateReportRequest } from "@svh/types";
import { createReportSchema } from "@svh/types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { createReport } from "../lib/api";

const categories = [
  { value: "harassment", label: "Harassment" },
  { value: "fraud", label: "Fraud" },
  { value: "corruption", label: "Corruption" },
  { value: "misconduct", label: "Misconduct" },
  { value: "other", label: "Other" }
] as const;

type ReportFormValues = Omit<
  CreateReportRequest,
  "confidentialityAccepted" | "consentAccepted"
> & {
  confidentialityAccepted: boolean;
  consentAccepted: boolean;
};

export function ReportPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      category: "harassment",
      title: "",
      description: "",
      incidentDateText: "",
      locationText: "",
      peopleInvolved: "",
      evidenceNotes: "",
      confidentialityAccepted: false,
      consentAccepted: false
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const result = await createReport(values as CreateReportRequest);

      navigate("/confirmation", {
        state: result
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to submit report."
      );
    }
  });

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

        <form className="form-card form-card-faceup" id="report-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Category</span>
            <select {...form.register("category")}>
              {categories.map((category) => (
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
              placeholder="Describe what happened in as much detail as you feel safe sharing."
              {...form.register("description")}
            />
            <FieldError message={form.formState.errors.description?.message} />
          </label>

          <label className="field">
            <span>When did it happen?</span>
            <input
              placeholder="For example: Last week"
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
            <FieldError message={form.formState.errors.locationText?.message} />
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

        <div className="notice-block">
          <h2>Confidentiality note</h2>
          <p>
            Avoid sharing details that would reveal your identity unless you
            want investigators to have that information.
          </p>
        </div>

        <label className="checkbox">
          <input type="checkbox" {...form.register("confidentialityAccepted")} />
          <span>I understand how confidentiality works in this portal.</span>
        </label>
        <FieldError
          message={form.formState.errors.confidentialityAccepted?.message}
        />

        <label className="checkbox">
          <input type="checkbox" {...form.register("consentAccepted")} />
          <span>I confirm that this report is submitted in good faith.</span>
        </label>
        <FieldError message={form.formState.errors.consentAccepted?.message} />

        {submitError ? <p className="error-banner">{submitError}</p> : null}

        <div className="submit-row">
          <button
            className="button primary"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
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
