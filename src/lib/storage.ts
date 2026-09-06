import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function uploadFileLocallyOrS3(
  fileBuffer: Buffer,
  originalFilename: string,
  folder: 'profiles' | 'gallery' | 'verifications' = 'profiles'
): Promise<string> {
  // Ensure target folder exists
  const targetDir = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = path.extname(originalFilename) || '.jpg';
  const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}${ext}`;
  const filePath = path.join(targetDir, fileName);

  await fs.promises.writeFile(filePath, fileBuffer);

  // Return public URL path
  return `/uploads/${folder}/${fileName}`;
}

export function validateImageFile(fileType: string, fileSizeInBytes: number): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (!allowedTypes.includes(fileType)) {
    return { valid: false, error: 'Only JPEG, PNG, WEBP images and PDF documents are allowed.' };
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (fileSizeInBytes > maxSizeBytes) {
    return { valid: false, error: 'File size exceeds maximum limit of 10MB.' };
  }

  return { valid: true };
}

