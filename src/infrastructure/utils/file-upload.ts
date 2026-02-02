import multer from 'multer';
import fs from 'fs';
import path from 'path';

export function ensureUploadsDir(): string {
  const dir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export const avatarStorage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    const dir = ensureUploadsDir();
    cb(null, dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const name = `avatar_${Date.now()}_${base}${ext}`;
    cb(null, name);
  },
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const ok = allowedTypes.includes(file.mimetype);
    cb(ok ? null : new Error('INVALID_FILE_TYPE'), ok);
  },
});

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}



