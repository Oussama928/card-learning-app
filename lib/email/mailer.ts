import nodemailer from "nodemailer";
import logger from "@/lib/logger";

let transporter: nodemailer.Transporter | null = null;

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    logger.warn("smtp_not_configured", { mode: "jsonTransport" });
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const getMailer = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};
