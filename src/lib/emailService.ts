import { Resend } from 'resend';

const getResendApiKey = () => process.env.RESEND_API_KEY;
const getResendFromEmail = () => process.env.RESEND_FROM_EMAIL || 'Paireva <noreply@paireva.fun>';

/**
 * Sends a 6-digit email verification OTP to a user using Resend.
 */
export async function sendVerificationOTP(
  toEmail: string,
  otp: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = getResendApiKey();
    const fromEmail = getResendFromEmail();

    if (!apiKey) {
      console.warn('[EmailService Warning] RESEND_API_KEY is not set in environment. Demo OTP:', otp);
      // Return success in dev mode so flow can be tested end-to-end even without API key configured
      return { success: true };
    }

    const resend = new Resend(apiKey);
    const displayName = userName ? userName.split(' ')[0] : 'there';

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your Paireva email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #6D315D 0%, #E94B83 100%); width: 48px; height: 48px; border-radius: 14px; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">P</div>
            <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 16px; margin-bottom: 4px;">Verify Your Email</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Paireva Adult Social Companion Marketplace</p>
          </div>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Hello <strong>${displayName}</strong>,
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Welcome to Paireva. Please enter the 6-digit verification code below to verify your email address and activate your platform account:
          </p>

          <div style="background-color: #f1f5f9; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px dashed #cbd5e1;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6D315D;">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 24px; text-align: center;">
            This verification code will expire in <strong>10 minutes</strong>.<br>
            If you did not request this email, you can safely ignore it.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            &copy; ${new Date().getFullYear()} Paireva. All rights reserved.
          </p>
        </div>
      </body>
    </html>
    `;

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Verify your Paireva email',
      html,
    });

    if (data.error) {
      console.error('[Resend Email Delivery Error]', data.error);
      return { success: false, error: data.error.message || 'Failed to deliver verification email' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[EmailService Exception]', err);
    return { success: false, error: err.message || 'Email delivery service failure' };
  }
}

