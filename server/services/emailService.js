const { Resend } = require("resend");
const env = require("../config/env");
const logger = require("../config/logger");

const resend = new Resend(env.RESEND_API_KEY);

const sendPasswordResetEmail = async ({ email, resetUrl }) => {
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.startsWith("demo-")) {
    logger.warn({ event: "password_reset_email_mocked" }, "Resend API key missing; no real email sent.");
    return;
  }

  const response = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: "Reset your CloudVault password",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1a17;max-width:560px;margin:0 auto;">
        <h2 style="margin-bottom:12px;">Reset your CloudVault password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#2f1d1d;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;">Reset password</a>
        </p>
        <p>This reset link expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your CloudVault password\n\nUse this link to choose a new password: ${resetUrl}\n\nThis link expires in 15 minutes.`,
  });

  if (response.error) {
    throw new Error(response.error.message || "Failed to send password reset email.");
  }

  logger.info({ event: "password_reset_email_sent", email }, "Password reset email sent");
};

module.exports = { sendPasswordResetEmail };

