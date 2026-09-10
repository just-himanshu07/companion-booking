import { Resend } from 'resend';

export const RESEND_OTP_TEMPLATE_ID = '895469d4-ae07-4ae6-80f3-41400549ddca';

const getResendApiKey = () => process.env.RESEND_API_KEY;
const getResendFromEmail = () => process.env.RESEND_FROM_EMAIL || 'Paireva <noreply@paireva.fun>';

/**
 * Sends a 6-digit email verification OTP to a user using the published Resend Template.
 * Template ID: 895469d4-ae07-4ae6-80f3-41400549ddca (Paireva Otp / paireva-otp)
 * Pass variable OTP as a numeric JS number (e.g., 482913) as required by Resend template schema.
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
      console.warn('[EmailService Warning] RESEND_API_KEY is not set in environment.');
      // Return success in dev mode so flow can be tested end-to-end even without API key configured
      return { success: true };
    }

    const numericOtp = Number(otp);
    if (isNaN(numericOtp)) {
      console.error('[EmailService Error] Provided OTP is not a valid number.');
      return { success: false, error: 'Invalid OTP format' };
    }

    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Verify your Paireva email',
      template: {
        id: RESEND_OTP_TEMPLATE_ID,
        variables: {
          OTP: numericOtp,
        },
      },
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

/**
 * Sends a Password Reset email containing a secure link to the user.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = getResendApiKey();
    const fromEmail = getResendFromEmail();

    if (!apiKey) {
      console.warn('[EmailService Warning] RESEND_API_KEY is not set in environment.');
      console.log(`[Dev Mode Password Reset Link for ${toEmail}]: ${resetLink}`);
      // Return success in dev mode so flow can be tested end-to-end even without API key configured
      return { success: true };
    }

    const resend = new Resend(apiKey);
    const greetingName = userName ? userName : 'Paireva User';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Paireva Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 20px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Paireva</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Password Reset Request</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; line-height: 1.5; margin-top: 0; color: #0f172a; font-weight: 600;">Hello ${greetingName},</p>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
              We received a request to reset the password for your Paireva account associated with <strong>${toEmail}</strong>. Click the button below to choose a new password:
            </p>
            
            <!-- Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" target="_blank" style="background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.3);">
                Reset Password
              </a>
            </div>

            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-bottom: 8px;">
              If the button doesn't work, copy and paste this link into your web browser:
            </p>
            <p style="font-size: 12px; line-height: 1.5; color: #7c3aed; word-break: break-all; margin-top: 0; background-color: #f1f5f9; padding: 10px; border-radius: 8px;">
              ${resetLink}
            </p>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px;">
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
                🔒 <strong>Security Note:</strong> This password reset link will expire in <strong>60 minutes</strong>. If you did not request a password reset, no further action is required and your account remains secure.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} Paireva. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Reset your Paireva password',
      html: htmlContent,
    });

    if (data.error) {
      console.error('[Resend Email Delivery Error]', data.error);
      return { success: false, error: data.error.message || 'Failed to deliver password reset email' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[EmailService Exception]', err);
    return { success: false, error: err.message || 'Email delivery service failure' };
  }
}

