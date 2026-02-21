import logger from "@/lib/logger";
import { getMailer } from "@/lib/email/mailer";
import { renderEmailTemplate } from "@/lib/email/templates";

export interface EmailPayload {
  template:
    | "verify-email"
    | "password-reset"
    | "daily-reminder"
    | "notification-digest"
    | "skill-tree-certificate";
  to: string;
  data: Record<string, any>;
}

export const sendTemplatedEmail = async (payload: EmailPayload): Promise<void> => {
  console.log("Sending email to", payload.to, "template", payload.template);
  const fromAddress = process.env.EMAIL_FROM || "noreply@card-learning.app";
  const { subject, html, text } = renderEmailTemplate(payload.template, payload.data);

  if (!process.env.SMTP_HOST) {
    return;
  }

  await getMailer().sendMail({
    from: fromAddress,
    to: payload.to,
    subject,
    html,
    text,
  });

  logger.info("email_sent", {
    to: payload.to,
    template: payload.template,
  });
};
