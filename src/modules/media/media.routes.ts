import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = Router();

function isAdmin(req: any) {
  const adminKey = (req.headers['x-admin-key'] as string) || '';
  return process.env.ADMIN_SECRET && adminKey === process.env.ADMIN_SECRET;
}

function ensureUploadsDir() {
  const dir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => {
    const dir = ensureUploadsDir();
    cb(null, dir);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const name = `${Date.now()}_${base}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('INVALID_FILE_TYPE'), ok);
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'UNAUTHORIZED' });
  const f = (req as any).file;
  if (!f) return res.status(400).json({ ok: false, error: 'NO_FILE' });
  const fileUrl = `/uploads/${f.filename}`;
  res.json({ ok: true, url: fileUrl, filename: f.filename, size: f.size, mime: f.mimetype });
});

export default router;
