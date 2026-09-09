export interface FilterResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Server-side security filter to block off-platform contact details,
 * social media handles, phone numbers, email addresses, and direct payment methods
 * before a confirmed booking.
 */
export function validateOffPlatformContent(text?: string | null): FilterResult {
  if (!text || !text.trim()) {
    return { isValid: true };
  }

  const normalized = text.toLowerCase();

  // 1. Phone number detection (10+ digits sequence even with spaces/dots/dashes)
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    return {
      isValid: false,
      errorMessage: 'For your safety, contact details and off-platform payments cannot be shared before a confirmed booking.',
    };
  }

  // 2. Email pattern detection
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  if (emailRegex.test(text)) {
    return {
      isValid: false,
      errorMessage: 'For your safety, contact details and off-platform payments cannot be shared before a confirmed booking.',
    };
  }

  // 3. Web links and short URLs
  const urlRegex = /(https?:\/\/|www\.|wa\.me|t\.me|ig\.me|paypal\.me)/i;
  if (urlRegex.test(text)) {
    return {
      isValid: false,
      errorMessage: 'For your safety, contact details and off-platform payments cannot be shared before a confirmed booking.',
    };
  }

  // 4. Forbidden keywords and off-platform phrases
  const forbiddenKeywords = [
    'whatsapp',
    'whats app',
    'watsapp',
    'watsap',
    'insta',
    'instagram',
    'telegram',
    'snapchat',
    'upi',
    'paytm',
    'gpay',
    'google pay',
    'phonepe',
    'bank transfer',
    'pay directly',
    'pay cash',
    'direct payment',
    'call me',
    'call my number',
    'contact me',
    'send your number',
    'send phone',
    'my number is',
    'ping me on',
    'dm me on',
    'text me at',
    'message me on',
    'outside paireva',
    'off platform',
    'off-platform',
  ];

  for (const keyword of forbiddenKeywords) {
    if (normalized.includes(keyword)) {
      return {
        isValid: false,
        errorMessage: 'For your safety, contact details and off-platform payments cannot be shared before a confirmed booking.',
      };
    }
  }

  return { isValid: true };
}

