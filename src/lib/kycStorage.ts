import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const PRIMARY_DIR = path.join(process.cwd(), 'private_storage', 'kyc');
const FALLBACK_DIR = path.join(os.tmpdir(), 'private_storage', 'kyc');

function getWritableDir(): string {
  try {
    if (!fs.existsSync(PRIMARY_DIR)) {
      fs.mkdirSync(PRIMARY_DIR, { recursive: true });
    }
    const testFile = path.join(PRIMARY_DIR, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return PRIMARY_DIR;
  } catch (err) {
    try {
      if (!fs.existsSync(FALLBACK_DIR)) {
        fs.mkdirSync(FALLBACK_DIR, { recursive: true });
      }
      return FALLBACK_DIR;
    } catch (fallbackErr) {
      return FALLBACK_DIR;
    }
  }
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

  // 2. MIME Type Validation & Fallback Detection
  let mimeType = file.type ? file.type.toLowerCase() : '';

  if (!mimeType || mimeType === 'application/octet-stream') {
    if (prefix === 'selfie') {
      mimeType = 'image/jpeg';
    } else if ('name' in file && typeof (file as any).name === 'string') {
      const fileNameLower = (file as any).name.toLowerCase();
      if (fileNameLower.endsWith('.png')) mimeType = 'image/png';
      else if (fileNameLower.endsWith('.webp')) mimeType = 'image/webp';
      else if (fileNameLower.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (fileNameLower.endsWith('.jpg') || fileNameLower.endsWith('.jpeg')) mimeType = 'image/jpeg';
    }
  }

  // Default selfie or fallback images to image/jpeg if type still missing
  if (!mimeType) {
    mimeType = 'image/jpeg';
  }

  if (!ALLOWED_KYC_MIME_TYPES.includes(mimeType)) {
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
  
  const targetDir = getWritableDir();
  const filePath = path.join(targetDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  // Secure URL reference served through authenticated API
  const fileUrl = `/api/verification/document/${fileName}`;
  return { fileName, fileUrl };
}

export async function readSecureKYCFile(fileName: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Prevent path traversal attacks and query parameter issues
  const decoded = decodeURIComponent(fileName || '').split('?')[0];
  const safeName = path.basename(decoded);
  
  if (!safeName || safeName === '.' || safeName === '..') {
    return null;
  }
  
  let filePath = path.join(PRIMARY_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(FALLBACK_DIR, safeName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
  }

  const buffer = await fs.promises.readFile(filePath);

  let mimeType = 'image/jpeg';
  if (safeName.endsWith('.png')) mimeType = 'image/png';
  if (safeName.endsWith('.webp')) mimeType = 'image/webp';
  if (safeName.endsWith('.pdf')) mimeType = 'application/pdf';

  return { buffer, mimeType };
}


