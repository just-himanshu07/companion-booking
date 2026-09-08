import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * Example: "482913"
 */
export function generateNumericOTP(): string {
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
}

/**
 * Hashes a 6-digit OTP using bcrypt with 10 salt rounds.
 */
export async function hashOTP(otp: string): Promise<string> {
  return await bcrypt.hash(otp, 10);
}

/**
 * Compares an unhashed OTP against a stored bcrypt hash.
 */
export async function verifyOTPHash(otp: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(otp, hash);
  } catch {
    return false;
  }
}

/**
 * Masks an email address for public display in verification UI.
 * Example: rajesh.kumar@gmail.com -> r**********@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const maskedName = name[0] + '*'.repeat(Math.min(name.length - 2, 8)) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

