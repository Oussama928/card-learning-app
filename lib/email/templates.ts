import type { EmailPayload } from "@/lib/email/service";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const getAppUrl = () => process.env.APP_URL || "http://localhost:3000";

const renderVerifyEmail = (data: EmailPayload["data"]): RenderedEmail => {
  const otp = String(data.otp || "");
  return {
    subject: "Verify your Card Learning account",
    html: `<p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
    text: `Your verification code is ${otp}. This code expires in 10 minutes.`,
  };
};

const renderPasswordReset = (data: EmailPayload["data"]): RenderedEmail => {
  const token = String(data.token || "");
  const resetLink = `${getAppUrl()}/reset-password/${token}`;

  return {
    subject: "Reset your Card Learning password",
    html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link expires in 30 minutes.</p>`,
    text: `Reset your password: ${resetLink}. This link expires in 30 minutes.`,
  };
};

const renderDailyReminder = (data: EmailPayload["data"]): RenderedEmail => {
  const username = String(data.username || "Learner");
  return {
    subject: "Keep your learning streak alive",
    html: `<p>Hi ${username}, your daily learning reminder is here. Keep your streak alive today.</p>`,
    text: `Hi ${username}, your daily learning reminder is here. Keep your streak alive today.`,
  };
};

const renderNotificationDigest = (data: EmailPayload["data"]): RenderedEmail => {
  const summary = String(data.summary || "You have new updates in Card Learning.");
  return {
    subject: "Your Card Learning updates",
    html: `<p>${summary}</p>`,
    text: summary,
  };
};

const renderSkillTreeCertificate = (data: EmailPayload["data"]): RenderedEmail => {
  const username = String(data.username || "Learner");
  const treeName = String(data.treeName || "Skill Tree");
  const certificateUrl = String(data.certificateUrl || getAppUrl());

  return {
    subject: `Certificate unlocked: ${treeName}`,
    html: `
      <p>Congratulations ${username}!</p>
      <p>You completed the ${treeName} skill tree.</p>
      <p>Download your certificate here:</p>
      <p><a href="${certificateUrl}">${certificateUrl}</a></p>
    `,
    text: `Congratulations ${username}! You completed the ${treeName} skill tree. Download your certificate: ${certificateUrl}`,
  };
};

export const renderEmailTemplate = (
  template: EmailPayload["template"],
  data: EmailPayload["data"]
): RenderedEmail => {
  switch (template) {
    case "verify-email":
      return renderVerifyEmail(data);
    case "password-reset":
      return renderPasswordReset(data);
    case "daily-reminder":
      return renderDailyReminder(data);
    case "notification-digest":
      return renderNotificationDigest(data);
    case "skill-tree-certificate":
      return renderSkillTreeCertificate(data);
    default:
      return {
        subject: "Card Learning",
        html: "<p>No template available.</p>",
        text: "No template available.",
      };
  }
};
