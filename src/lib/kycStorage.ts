import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SECURE_KYC_DIR = path.join(process.cwd(), 'private_storage', 'kyc');

// Ensure directory exists
if (!fs.existsSync(SECURE_KYC_DIR)) {
  fs.mkdirSync(SECURE_KYC_DIR, { recursive: true });
}

export const ALLOWED_KYC_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_KYC_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function saveSecureKYCFile(
  file: File | Blob,
  prefix: string
): Promise<{ fileName: string; fileUrl: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. File Size Validation
  if (buffer.length > MAX_KYC_FILE_SIZE) {
    throw new Error('File size exceeds the 5MB limit.');
  }

  // 2. MIME Type Validation
  const mimeType = file.type?.toLowerCase();
  if (!mimeType || !ALLOWED_KYC_MIME_TYPES.includes(mimeType)) {
    throw new Error('Unsupported file format. Please upload JPG, PNG, WEBP, or PDF files only.');
  }

  // Determine safe extension
  let ext = '.jpg';
  if (mimeType === 'image/png') ext = '.png';
  if (mimeType === 'image/webp') ext = '.webp';
  if (mimeType === 'application/pdf') ext = '.pdf';

  // 3. Generate random secure filename (prevents path traversal & filename guessing)
  const randomUUID = crypto.randomUUID();
  const fileName = `${prefix}_${Date.now()}_${randomUUID}${ext}`;
  const filePath = path.join(SECURE_KYC_DIR, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // Secure URL reference served through authenticated API
  const fileUrl = `/api/verification/document/${fileName}`;
  return { fileName, fileUrl };
}

export async function readSecureKYCFile(fileName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Prevent path traversal attacks
  const safeName = path.basename(fileName);
  const filePath = path.join(SECURE_KYC_DIR, safeName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(filePath);

  let mimeType = 'image/jpeg';
  if (safeName.endsWith('.png')) mimeType = 'image/png';
  if (safeName.endsWith('.webp')) mimeType = 'image/webp';
  if (safeName.endsWith('.pdf')) mimeType = 'application/pdf';

  return { buffer, mimeType };
}

