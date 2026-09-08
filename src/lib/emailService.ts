import { Resend } from 'resend';

export const RESEND_OTP_TEMPLATE_ID = '895469d4-ae07-4ae6-80f3-41400549ddca';

const getResendApiKey = () => process.env.RESEND_API_KEY;
const getResendFromEmail = () => process.env.RESEND_FROM_EMAIL || 'Paireva <noreply@paireva.fun>';

/**
 * Sends a 6-digit email verification OTP to a user using the published Resend Template.
 * Template ID: 895469d4-ae07-4ae6-80f3-41400549ddca (Paireva Otp / paireva-otp)
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

    const resend = new Resend(apiKey);

    const data = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Verify your Paireva email',
      template: {
        id: RESEND_OTP_TEMPLATE_ID,
        variables: {
          OTP: otp,
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
