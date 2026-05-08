import nodemailer from "nodemailer";
import type { AppConfig } from "../config/appConfig.js";

interface SendReporterAccessEmailInput {
  caseId: string;
  secret: string;
  reporterEmail: string;
  submittedAt: string;
}

export class ReporterEmailService {
  private readonly transporter;

  constructor(private readonly config: AppConfig) {
    this.transporter = config.smtp.configured
      ? nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: config.smtp.user
            ? {
                user: config.smtp.user,
                pass: config.smtp.password
              }
            : undefined
        })
      : null;
  }

  async sendAccessEmail(
    input: SendReporterAccessEmailInput
  ): Promise<boolean> {
    if (!this.transporter || !this.config.smtp.from) {
      return false;
    }

    const trackingUrl = `${this.config.reporterPortalUrl.replace(/\/$/, "")}/track`;
    const subject = `SVH SpeakUp case ${input.caseId}`;

    await this.transporter.sendMail({
      from: this.config.smtp.from,
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

    return true;
  }
}
