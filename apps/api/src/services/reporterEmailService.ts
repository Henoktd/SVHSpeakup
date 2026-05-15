import nodemailer from "nodemailer";
import type { AppConfig } from "../config/appConfig.js";

interface SendReporterAccessEmailInput {
  caseId: string;
  secret: string;
  reporterEmail: string;
  submittedAt: string;
}

interface ReporterEmailTransportContext {
  deliveryMode: "smtp" | "ethereal";
  from: string;
  transporter: nodemailer.Transporter;
}

export interface ReporterAccessEmailDeliveryResult {
  emailed: boolean;
  deliveryMode: "disabled" | "smtp" | "ethereal";
  previewUrl?: string;
}

function describeSmtpConfig(config: AppConfig["smtp"]): Record<string, boolean> {
  return {
    configured: config.configured,
    useEthereal: config.useEthereal,
    hostConfigured: Boolean(config.host),
    fromConfigured: Boolean(config.from),
    authConfigured: !config.user || Boolean(config.password)
  };
}

function getEmailDomain(emailAddress: string): string {
  const separatorIndex = emailAddress.lastIndexOf("@");

  if (separatorIndex === -1) {
    return "invalid";
  }

  return emailAddress.slice(separatorIndex + 1).toLowerCase();
}

export class ReporterEmailService {
  private readonly transportContextPromise: Promise<ReporterEmailTransportContext | null>;

  constructor(private readonly config: AppConfig) {
    this.transportContextPromise = this.createTransportContext();
  }

  async sendAccessEmail(
    input: SendReporterAccessEmailInput
  ): Promise<ReporterAccessEmailDeliveryResult> {
    const transportContext = await this.transportContextPromise;

    if (!transportContext) {
      console.warn(
        JSON.stringify({
          event: "reporterEmail.deliveryDisabled",
          caseId: input.caseId,
          smtp: describeSmtpConfig(this.config.smtp)
        })
      );

      return {
        emailed: false,
        deliveryMode: "disabled"
      };
    }

    const trackingUrl = `${this.config.reporterPortalUrl.replace(/\/$/, "")}/track`;
    const subject = `SVH SpeakUp case ${input.caseId}`;

    console.log(
      JSON.stringify({
        event: "reporterEmail.sendAttempt",
        caseId: input.caseId,
        deliveryMode: transportContext.deliveryMode,
        reporterEmailDomain: getEmailDomain(input.reporterEmail)
      })
    );

    try {
      const emailInfo = await transportContext.transporter.sendMail({
        from: transportContext.from,
        to: input.reporterEmail,
        subject,
        text: [
          "Your SVH SpeakUp report details",
          "",
          `Case ID: ${input.caseId}`,
          `Secret: ${input.secret}`,
          `Submitted at: ${new Date(input.submittedAt).toUTCString()}`,
          "",
          `Track your case: ${trackingUrl}`,
          "",
          "Keep this email somewhere safe. Your case ID and secret are the only way to access your anonymous case."
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; color: #12243d; line-height: 1.6;">
            <h2 style="margin-bottom: 12px;">SVH SpeakUp case details</h2>
            <p>Your report details are below. Keep them somewhere safe.</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px 12px; font-weight: 700;">Case ID</td>
                <td style="padding: 8px 12px;">${input.caseId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: 700;">Secret</td>
                <td style="padding: 8px 12px;">${input.secret}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; font-weight: 700;">Submitted at</td>
                <td style="padding: 8px 12px;">${new Date(input.submittedAt).toUTCString()}</td>
              </tr>
            </table>
            <p>
              Track your case here:
              <a href="${trackingUrl}">${trackingUrl}</a>
            </p>
            <p>Your case ID and secret are the only way to access your anonymous case later.</p>
          </div>
        `
      });
      const previewUrl = nodemailer.getTestMessageUrl(emailInfo);

      console.log(
        JSON.stringify({
          event: "reporterEmail.sendSuccess",
          caseId: input.caseId,
          deliveryMode: transportContext.deliveryMode,
          reporterEmailDomain: getEmailDomain(input.reporterEmail),
          previewAvailable:
            transportContext.deliveryMode === "ethereal" &&
            typeof previewUrl === "string"
        })
      );

      return {
        emailed: true,
        deliveryMode: transportContext.deliveryMode,
        previewUrl:
          transportContext.deliveryMode === "ethereal"
            ? typeof previewUrl === "string"
              ? previewUrl
              : undefined
            : undefined
      };
    } catch (error) {
      console.error(
        JSON.stringify({
          event: "reporterEmail.sendFailure",
          caseId: input.caseId,
          deliveryMode: transportContext.deliveryMode,
          reporterEmailDomain: getEmailDomain(input.reporterEmail),
          smtp: describeSmtpConfig(this.config.smtp),
          message: error instanceof Error ? error.message : String(error)
        })
      );
      throw error;
    }
  }

  private async createTransportContext(): Promise<ReporterEmailTransportContext | null> {
    if (this.config.smtp.configured && this.config.smtp.host && this.config.smtp.from) {
      return {
        deliveryMode: "smtp",
        from: this.config.smtp.from,
        transporter: nodemailer.createTransport({
          host: this.config.smtp.host,
          port: this.config.smtp.port,
          secure: this.config.smtp.secure,
          auth: this.config.smtp.user
            ? {
                user: this.config.smtp.user,
                pass: this.config.smtp.password
              }
            : undefined
        })
      };
    }

    if (!this.config.smtp.useEthereal) {
      return null;
    }

    const testAccount = await nodemailer.createTestAccount();

    return {
      deliveryMode: "ethereal",
      from: this.config.smtp.from || testAccount.user,
      transporter: nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      })
    };
  }
}
