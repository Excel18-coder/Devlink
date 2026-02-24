import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass, // Use a Gmail App Password, NOT your regular password
  },
  connectionTimeout: 10_000,  // fail fast if SMTP unreachable
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Devlink Email Verification</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Devlink</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Verify your email address</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hi there,</p>
                    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                      Use the verification code below to complete your Devlink registration. This code expires in <strong>10 minutes</strong>.
                    </p>
                    <!-- OTP Box -->
                    <div style="background:#f9fafb;border:2px dashed #6366f1;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px;">
                      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
                      <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:10px;color:#4f46e5;">${otp}</p>
                    </div>
                    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.5;">
                      If you did not request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Devlink · All rights reserved</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Your Devlink verification code",
    html,
  });
}
