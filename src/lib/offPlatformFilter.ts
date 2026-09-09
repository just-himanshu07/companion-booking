export interface FilterResult {
  isValid: boolean;
  errorMessage?: string;
}

export const OFF_PLATFORM_ERROR_MESSAGE =
  'Contact details and off-platform payment information cannot be shared before a confirmed booking. Please keep communication on Paireva until your booking is confirmed.';

/**
 * Security filter to detect and block off-platform contact details,
 * social media handles, phone numbers, email addresses, and direct payment methods
 * before a confirmed booking.
 */
export function validateOffPlatformContent(text?: string | null): FilterResult {
  if (!text || !text.trim()) {
    return { isValid: true };
  }

  // 1. Phone number detection
  // A. Continuous sequence of 10+ digits: e.g. 9876543210 or +919876543210
  const continuous10Digits = /\b(?:\+?\d{1,3}[-.\s]?)?\d{10}\b/;
  // B. Standard phone formats with separators: e.g. (987) 654-3210 or 987-654-3210 or +91-987-6543210
  const phoneSeparatorFormat = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  // C. Spaced out phone digits (e.g. "9 8 7 6 5 4 3 2 1 0")
  const digitsMatches = text.match(/(?:\d\s*){10,}/g);
  if (digitsMatches) {
    for (const m of digitsMatches) {
      const pureDigits = m.replace(/\D/g, '');
      if (pureDigits.length >= 10 && pureDigits.length <= 13) {
        return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
      }
    }
  }

  if (continuous10Digits.test(text) || phoneSeparatorFormat.test(text)) {
    return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
  }

  // 2. Email pattern detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  if (emailRegex.test(text)) {
    return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
  }

  // 3. Web links, short URLs, and link schemes
  const urlRegex = /(https?:\/\/|www\.|wa\.me|t\.me|ig\.me|paypal\.me|paytm\.me)/i;
  if (urlRegex.test(text)) {
    return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
  }

  // 4. UPI IDs (e.g. username@okhdfcbank, john@paytm, 9876543210@ybl)
  const upiRegex = /[a-zA-Z0-9._-]+@(okhdfcbank|okaxis|okicici|paytm|ybl|postbank|gpay|upi|ibl|barodampay|sbi)/i;
  if (upiRegex.test(text)) {
    return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
  }

  // 5. Social Media Handle patterns (e.g., @username or instagram/telegram/insta context)
  const socialHandleContextRegex = /(?:instagram|insta|telegram|snapchat|twitter|fb|facebook|tiktok|ig|tg)\s*:?\s*@?[a-zA-Z0-9._]+/i;
  const directHandleRegex = /@([a-zA-Z0-9._]{3,})/i;
  if (socialHandleContextRegex.test(text) || directHandleRegex.test(text)) {
    return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
  }

  // 6. Off-platform contact and payment phrases/keywords
  const forbiddenPhrases = [
    /\bwhatsapp\b/i,
    /\bwhats app\b/i,
    /\bwatsapp\b/i,
    /\bwatsap\b/i,
    /\btelegram\b/i,
    /\bsnapchat\b/i,
    /\binstagram\b/i,
    /\binsta\b/i,
    /\bupi\b/i,
    /\bpaytm\b/i,
    /\bgpay\b/i,
    /\bgoogle pay\b/i,
    /\bphonepe\b/i,
    /\bbank transfer\b/i,
    /\bpay directly\b/i,
    /\bpayment directly\b/i,
    /\bsend payment\b/i,
    /\bpay cash\b/i,
    /\bdirect payment\b/i,
    /\bcall me\b/i,
    /\bcall my number\b/i,
    /\bmy number is\b/i,
    /\bping me on\b/i,
    /\bdm me on\b/i,
    /\btext me at\b/i,
    /\bmessage me on\b/i,
    /\boutside paireva\b/i,
    /\boff platform\b/i,
    /\boff-platform\b/i,
    /\bcontact me outside\b/i,
    /\bcontact outside\b/i,
    /\bshare contact\b/i,
    /\bshare number\b/i,
    /\bsend number\b/i,
    /\bsend phone\b/i,
  ];

  for (const pattern of forbiddenPhrases) {
    if (pattern.test(text)) {
      return { isValid: false, errorMessage: OFF_PLATFORM_ERROR_MESSAGE };
    }
  }

  return { isValid: true };
}
